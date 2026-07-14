// kvWrite 云函数 —— love-h5 的唯一写入口
// 把所有写操作集中到云函数（管理员权限，绕过用户权限），保证：
//  1. 跨用户可写（情侣 B 能改 A 建的文档）—— 对应原 Supabase 的 anon 全放行 + security definer
//  2. update/push 的原子性（点号路径浅合并，避免读-改-写覆盖）
//  3. 顺手修掉原 Supabase 分支 update(null) 不删键的语义陷阱（这里 null → 整路径置空）
//
// kv collection 文档结构：{ _id, room, path, value, ts }，业务唯一键 (room, path)
// 用法：wx.cloud.callFunction({ name:'kvWrite', data:{ action, room, path, ... } })
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const KV = 'kv';

async function findDoc(room, path) {
  const res = await db.collection(KV).where({ room, path }).limit(1).get();
  return res.data[0];
}

exports.main = async (event, context) => {
  const { action, room, path } = event;
  const ts = Date.now();
  const col = db.collection(KV);
  const doc = await findDoc(room, path);

  // —— set：整路径覆盖写（value=null 等于清空但保留行，便于 watch 继续）——
  if (action === 'set') {
    const value = event.value === undefined ? null : event.value;
    if (doc) await col.doc(doc._id).update({ data: { value, ts } });
    else await col.add({ data: { room, path, value, ts } });
    return { ok: true };
  }

  // —— update：浅合并 value 的顶层键（对应原 merge_kv）——
  if (action === 'update') {
    const partial = event.partial;
    if (partial === null) {
      // null → 整路径置空（修复原 jsonb || null 不删键的陷阱）
      if (doc) await col.doc(doc._id).update({ data: { value: null, ts } });
      else await col.add({ data: { room, path, value: null, ts } });
      return { ok: true };
    }
    if (doc) {
      // 点号路径明确浅合并：value.a = partial.a，不动 value.b
      const data = { ts };
      for (const k in partial) data[`value.${k}`] = partial[k];
      await col.doc(doc._id).update({ data });
    } else {
      await col.add({ data: { room, path, value: partial, ts } });
    }
    return { ok: true };
  }

  // —— push：往 value 对象里塞一条 {key: val}（对应原 push_kv）——
  if (action === 'push') {
    const { key, val } = event;
    if (doc) {
      await col.doc(doc._id).update({ data: { ts, [`value.${key}`]: val } });
    } else {
      await col.add({ data: { room, path, value: { [key]: val }, ts } });
    }
    return { ok: true };
  }

  // —— remove：删整行 ——
  if (action === 'remove') {
    if (doc) await col.doc(doc._id).remove();
    return { ok: true };
  }

  return { ok: false, reason: 'unknown action: ' + action };
};
