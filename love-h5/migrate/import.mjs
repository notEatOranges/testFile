// import.mjs —— 全自动迁移：直连云开发拉三集合 + 下载 cloud:// 文件 + 生成 import.json
// 用法：
//   cd migrate && npm install
//   TCB_ENV=你的环境ID TCB_SECRET_ID=AKID... TCB_SECRET_KEY=... node import.mjs
// 密钥来源：腾讯云控制台「访问管理 → API 密钥管理」（云开发归属的账号）
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const OUT = join(root, '..', 'server', 'data', 'import.json')
const FILES_OUT = join(root, '..', 'server', 'data', 'files', 'import')

const { ENV, SECRET_ID, SECRET_KEY } = process.env
const ACCOUNTS = {
  boy: { username: process.env.BOY_USER || 'boy2026', password: process.env.BOY_PASS || 'love2026' },
  girl: { username: process.env.GIRL_USER || 'girl2026', password: process.env.GIRL_PASS || 'love2026' }
}

if (!ENV || !SECRET_ID || !SECRET_KEY) {
  console.error('用法: TCB_ENV=环境ID TCB_SECRET_ID=AKID... TCB_SECRET_KEY=... node import.mjs')
  process.exit(1)
}

const tcb = await import('@cloudbase/node-sdk')
const app = tcb.init({ env: ENV, secretId: SECRET_ID, secretKey: SECRET_KEY })
const db = app.database()
const $ = db.command

async function coll(name) {
  const out = []
  let skip = 0
  for (;;) {
    const res = await db.collection(name).skip(skip).limit(100).get()
    out.push(...res.data)
    if (res.data.length < 100) break
    skip += 100
  }
  console.log(`[ok] ${name}: ${out.length} 条`)
  return out
}

const users = await coll('users')
const couples = await coll('couples')
const kv = await coll('kv')

if (!couples.length) { console.error('[error] couples 集合为空'); process.exit(1) }
const couple = couples[0]
const coupleId = couple.coupleId || couple._id
const members = couple.members || {}
const byOpenid = new Map(users.map((u) => [u.openid, u]))

// 下载 kv 里引用的全部 cloud:// 文件 → /files/import/<n>-<原名>
const fileMap = {}
mkdirSync(FILES_OUT, { recursive: true })
const fileIds = new Set()
for (const row of kv) {
  const s = JSON.stringify(row.value ?? {})
  for (const m of s.matchAll(/cloud:\/\/[^"]+/g)) fileIds.add(m[0])
}
console.log(`[ok] 需要下载的云端文件: ${fileIds.size} 个`)
let i = 0
for (const fid of fileIds) {
  i++
  try {
    const cloudPath = fid.replace('cloud://', '').split('/')
    cloudPath.shift() // 去掉 <env>.<appid> 段
    const localName = `${i}-` + cloudPath[cloudPath.length - 1]
    const localPath = join(FILES_OUT, localName)
    await app.downloadFile({ cloudPath: cloudPath.join('/'), localPath })
    fileMap[fid] = `/files/import/${encodeURIComponent(localName)}`
    if (i % 10 === 0) console.log(`  …已下载 ${i}/${fileIds.size}`)
  } catch (e) {
    console.warn(`[warn] 下载失败 ${fid}: ${e.message}`)
  }
}

// 头像也认领进账号资料
const accounts = {}
for (const role of ['boy', 'girl']) {
  const src = (members[role] && byOpenid.get(members[role])) || {}
  const avatarFileID = src.avatar || ''
  accounts[role] = {
    username: ACCOUNTS[role].username,
    password: ACCOUNTS[role].password,
    nick: src.nick || ACCOUNTS[role].username,
    avatar: fileMap[avatarFileID] || ''
  }
}

const out = {
  accounts,
  couple: { id: coupleId, inviteCode: couple.inviteCode || '' },
  kv: kv.map((r) => ({ room: r.room || coupleId, path: r.path, value: r.value ?? null, ts: r.ts || Date.now() })),
  fileMap
}
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(out))
console.log(`[done] 已生成 ${OUT}（kv ${out.kv.length} 行 / 文件 ${Object.keys(fileMap).length} 个）`)
console.log('下一步：启动后端自动导入，或 POST /api/admin/import 手动导入。')
