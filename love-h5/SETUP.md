# SETUP · 配置云端实时后端（Supabase / MemFire）

> 看这份之前先看 [README.md](./README.md)。
>
> **不配置也能用**：未填后端时，站点自动进入**本地预览模式**（localStorage + BroadcastChannel，同浏览器多 tab 可模拟双人）。配置后才有「跨手机异地实时」。
>
> 本应用**没有自建服务器**，实时能力来自云端 BaaS。最终落地选型是 **Supabase**（[supabase.com](https://supabase.com)）；**MemFire**（[memfirecmp.com](https://memfirecmp.com)，国产）是 API 完全兼容的国内替代，代码一行不改，只换 `url` / `anonKey`。

---

## 一句话原理

整站所有实时数据（对话、心情、游戏状态…）都扁平化成一张通用 **`kv` 表**：

| 列 | 类型 | 说明 |
|---|---|---|
| `room` | text | 房间号（两人约定的同一个） |
| `path` | text | 数据路径，如 `chat`、`games/catfish/g1/players/boy` |
| `value` | jsonb | 该路径下的值（对象/数组/标量都行） |
| `ts` | bigint | 毫秒时间戳 |

复合唯一键 `(room, path)`：每个房间下每条路径一行。读写订阅全靠它，`store.js` 把「路径树」拍平成 KV，功能代码与本地模式完全一致。

---

## 步骤 1：注册并建项目

### 方案 A · Supabase（默认，海外）
1. 打开 [supabase.com](https://supabase.com) 注册（GitHub 登录即可）。
2. **New Project** → 取个名字，区域选离你近的（亚太选 `Northeast Asia (Tokyo)` / `Southeast Asia (Singapore)`），设数据库密码（可忘了它，本应用用不到）。
3. 等约 2 分钟建库完成。
4. 左侧 **Project Settings → API**，拿到：
   - **Project URL**：形如 `https://abcd1234.supabase.co`
   - **anon public** key（**不是** service_role！）

### 方案 B · MemFire（国内更快，兼容）
1. 打开 [memfirecmp.com](https://memfirecmp.com) 注册。
2. 创建应用 → 创建数据库，拿到 **云数据库 URL**（形如 `https://xxx.memfiredb.com`）和 **anon key**（API Key）。
3. 后续 SQL 与配置与 Supabase **完全相同**（MemFire 是 Supabase 兼容云）。

> 二选一即可。下面以 Supabase 界面为例。

---

## 步骤 2：建表（SQL Editor 里跑一次）

进项目的 **SQL Editor → New query**，粘贴下面整段，**Run**：

```sql
-- 通用 KV 表：一个房间一条路径一行
create table if not exists public.kv (
  room  text        not null,
  path  text        not null default '',
  value jsonb,
  ts    bigint      not null default (extract(epoch from now()) * 1000)::bigint,
  constraint kv_room_path_key unique (room, path)
);

-- 顺手建个时间戳索引（按时间查询/清理用）
create index if not exists kv_ts_idx on public.kv (ts);

-- 开启行级安全（RLS）
alter table public.kv enable row level security;
```

---

## 步骤 3：安全规则（RLS 策略）

> **关于安全模型**：本应用把「房间号」当作两人共享的软密码——知道房间号的人能读写该房间数据。anon key 本就内嵌在前端、视为公开，真正的隔离靠房间号。因此这里给 anon 放开 `kv` 表的增删改查，**不要把房间号公开分享**。
>
> 若日后需要更强隔离（比如接 Supabase Auth 按用户鉴权），可在本节策略上叠加，不影响应用代码。

继续在 **SQL Editor** 里跑：

```sql
-- anon 角色对 kv 表全量放行（房间号即密钥）
create policy "kv read"   on public.kv for select using (true);
create policy "kv insert" on public.kv for insert with check (true);
create policy "kv update" on public.kv for update using (true) with check (true);
create policy "kv delete" on public.kv for delete using (true);
```

---

## 步骤 4：原子函数（防并发覆盖）

两人同时发消息/抢鱼时，若前端「读-改-写」会丢数据。所以 `update` / `push` 走两个 Postgres 原子函数（`store.js` 里已用 `rpc` 调它们）。继续在 **SQL Editor** 跑：

```sql
-- merge_kv：把 p_val 浅合并进 (room,path) 的现有 value（顶层键覆盖）
--   等价于 store 本地模式的 { ...cur, ...partial }
create or replace function public.merge_kv(p_room text, p_path text, p_val jsonb)
returns void
language plpgsql
security definer           -- 以属主身份运行，绕过 RLS，保证读改写原子
as $$
declare ms bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  insert into public.kv (room, path, value, ts)
  values (p_room, p_path, p_val, ms)
  on conflict (room, path)
  do update set value = public.kv.value || p_val,    -- jsonb || 浅合并
                 ts    = ms;
end;
$$;

-- push_kv：往 (room,path) 的对象里塞一个 {p_key: p_val}
--   等价于 store 本地模式的 list[id] = val
create or replace function public.push_kv(p_room text, p_path text, p_key text, p_val jsonb)
returns void
language plpgsql
security definer
as $$
declare ms bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  insert into public.kv (room, path, value, ts)
  values (p_room, p_path, jsonb_build_object(p_key, p_val), ms)
  on conflict (room, path)
  do update set value = public.kv.value || jsonb_build_object(p_key, p_val),
                 ts    = ms;
end;
$$;
```

---

## 步骤 5：开启实时（Realtime）

进 **Table Editor → kv 表**（或 Database → Replication），确认 `kv` 表已加入 **supabase_realtime** 发布，使前端 `channel.on('postgres_changes')` 能收到变更推送：

```sql
-- 也可用 SQL 一键加入实时发布
alter publication supabase_realtime add table public.kv;
```

> MemFire 同理（控制台开启该表的实时订阅，或执行上面这条）。

---

## 步骤 6：填前端配置

编辑 [`js/config/supabase-config.js`](./js/config/supabase-config.js)，把占位换成你的真实值：

```js
export const supabaseConfig = {
  url:     "https://abcd1234.supabase.co",   // ← 步骤 1 的 Project URL
  anonKey: "eyJhbGciOi....(anon public)",    // ← 步骤 1 的 anon public key
};
```

填好后，`isConfigured()` 返回 `true`，`store.js` 自动切到云端模式（刷新页面，控制台会打印 `[love-h5] 已连接 Supabase 实时数据库`）。

> 用 **MemFire**：把 `url` 换成 MemFire 的云数据库 URL，`anonKey` 换成 MemFire 的 API Key，**其余代码不动**。

---

## 步骤 7：验证

1. 本地预览（见 [README.md](./README.md)）：`node` 起静态服务 → 开页面。
2. 控制台看到 `[love-h5] 已连接 Supabase 实时数据库`（不再是「本地预览模式」）。
3. 两台**不同手机/不同网络**用同一房间号、不同身份进入 → 一方发消息/选游戏模式，另一方实时同步。
4. 进 Supabase 控制台 **Table Editor → kv**，能看到 `room=你们房间号` 下的各条数据行。

---

## 附：数据清理 / 多房间

- **清空某房间**：`delete from public.kv where room = '你的房间号';`
- **换房间**：在前端重新输房间号即可，旧房间数据仍在（各自隔离）。
- **多人/多对**：每对用不同房间号，数据互不可见。
