// pack.mjs —— 把云开发控制台手动导出的集合 JSON 打包成 server/data/import.json
// 用法：控制台导出 users/couples/kv 三个集合(JSON) 放进 ./cloud-export/，然后 node pack.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const EXPORT = join(root, 'cloud-export')
const OUT = join(root, '..', 'server', 'data', 'import.json')

// ★★★ 迁移后用来登录 H5 的两个账号，自己改 ★★★
const ACCOUNTS = {
  boy: { username: 'boy2026', password: 'love2026' },
  girl: { username: 'girl2026', password: 'love2026' }
}

// 兼容两种导出格式：NDJSON（每行一个 JSON 对象）或 JSON 数组
function load(name) {
  const p = join(EXPORT, name)
  if (!existsSync(p)) {
    console.warn(`[warn] 缺少 ${name}（继续，但该部分数据为空）`)
    return []
  }
  const text = readFileSync(p, 'utf8').trim()
  if (text.startsWith('[')) return JSON.parse(text)
  return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
}

const users = load('users.json')
const couples = load('couples.json')
const kv = load('kv.json')

if (!couples.length) {
  console.error('[error] couples.json 为空：没有情侣空间可导入')
  process.exit(1)
}
const couple = couples[0]
const coupleId = couple.coupleId || couple._id
const inviteCode = couple.inviteCode || ''
const members = couple.members || {}
console.log(`[ok] 空间 ${coupleId}（邀请码 ${inviteCode}）members:`, members)

// openid → { role, nick, avatar } 认领资料
const byOpenid = new Map(users.map((u) => [u.openid, u]))
const accounts = {}
for (const role of ['boy', 'girl']) {
  const openid = members[role]
  const src = (openid && byOpenid.get(openid)) || {}
  accounts[role] = {
    username: ACCOUNTS[role].username,
    password: ACCOUNTS[role].password,
    nick: src.nick || ACCOUNTS[role].username,
    avatar: '' // cloud:// 头像由路径 B 的 import.mjs 下载后回填；路径 A 可登录后在「我的」页重新设置
  }
  console.log(`[ok] ${role} → ${ACCOUNTS[role].username}（昵称: ${accounts[role].nick || '空'}）`)
}

const rows = kv
  .filter((r) => (r.room === coupleId) || true) // 全量带 room 导入，room 原样保留
  .map((r) => ({ room: r.room || coupleId, path: r.path, value: r.value ?? null, ts: r.ts || Date.now() }))
console.log(`[ok] kv 行数: ${rows.length}`)

const out = { accounts, couple: { id: coupleId, inviteCode }, kv: rows, fileMap: {} }
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(out))
console.log(`[done] 已生成 ${OUT}\n下一步：启动后端（java -jar love-nest.jar），检测到该文件会自动导入一次。`)
