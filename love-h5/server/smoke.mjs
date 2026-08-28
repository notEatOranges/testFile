// M1 冒烟测试：注册 → 配对 → kv 四种写语义 → WebSocket 广播 → 在线状态 → 真心话/文件目录
// 用法：node server/smoke.mjs（需后端已运行在 8080）
import WebSocket from '../web/node_modules/ws/index.js'

const BASE = 'http://localhost:8090'
let pass = 0
let fail = 0
function ok(cond, name) {
  if (cond) { pass++; console.log(`  ✓ ${name}`) } else { fail++; console.error(`  ✗ ${name}`) }
}
async function api(method, url, body, token) {
  const res = await fetch(BASE + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  return { status: res.status, data: await res.json().catch(() => null) }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const uid = Date.now().toString(36).slice(-5)

console.log('== 1. 注册两个账号 ==')
const boyName = `boy_${uid}`, girlName = `girl_${uid}`
const rb = await api('POST', '/api/auth/register', { username: boyName, password: 'love123', role: 'boy', nick: '小橙' })
ok(rb.status === 200 && rb.data.token, '注册男生账号')
const boy = rb.data.user
const rg = await api('POST', '/api/auth/register', { username: girlName, password: 'love123', role: 'girl', nick: '小桃' })
ok(rg.status === 200 && rg.data.token, '注册女生账号')
const girlTok = rg.data.token, boyTok = rb.data.token
const dup = await api('POST', '/api/auth/register', { username: boyName, password: 'love123', role: 'boy' })
ok(dup.status !== 200, '重复用户名被拒绝')

console.log('== 2. 情侣空间 ==')
const rc = await api('POST', '/api/couple/create', {}, boyTok)
ok(rc.status === 200 && rc.data.inviteCode?.length === 6, `创建空间，邀请码 ${rc.data.inviteCode}`)
const coupleId = rc.data.coupleId
const rj = await api('POST', '/api/couple/join', { inviteCode: rc.data.inviteCode.toLowerCase() }, girlTok)
ok(rj.status === 200 && rj.data.coupleId === coupleId, '女生凭码加入（小写自动转大写）')
const boy2 = `boy2_${uid}`
const r2 = await api('POST', '/api/auth/register', { username: boy2, password: 'love123', role: 'boy', nick: 'x' })
const rj2 = await api('POST', '/api/couple/join', { inviteCode: rc.data.inviteCode }, r2.data.token)
ok(rj2.status !== 200, '第二个 boy 加入被拒（角色槽位匹配）')
const rme = await api('GET', '/api/me', undefined, boyTok)
ok(rme.data.couple?.members?.length === 2, '空间成员两人')

console.log('== 3. kv 四种写语义 ==')
await api('POST', '/api/kv', { action: 'set', path: 'anniversary', value: { startDate: '2023-05-20' } }, boyTok)
const g1 = await api('GET', '/api/kv?path=anniversary', undefined, girlTok)
ok(g1.data.value?.startDate === '2023-05-20', 'set + 跨账号可见')
await api('POST', '/api/kv', { action: 'update', path: 'anniversary', partial: { note: '真好' } }, girlTok)
const g2 = await api('GET', '/api/kv?path=anniversary', undefined, boyTok)
ok(g2.data.value?.startDate === '2023-05-20' && g2.data.value?.note === '真好', 'update 浅合并不丢键')
await api('POST', '/api/kv', { action: 'push', path: 'chat', key: 'k_test1', val: { text: 'hi', sender: 'boy', ts: 123 } }, boyTok)
const g3 = await api('GET', '/api/kv?path=chat', undefined, girlTok)
ok(g3.data.value?.k_test1?.text === 'hi', 'push 塞一条')
await api('POST', '/api/kv', { action: 'push', path: 'chat', key: 'k_test2', val: { text: 'yo', sender: 'girl', ts: 124 } }, girlTok)
// 撤回（原版语义：读整值 → 改该条 → update 顶层键覆盖）
const cur = (await api('GET', '/api/kv?path=chat', undefined, girlTok)).data.value
cur.k_test2.recalled = true
await api('POST', '/api/kv', { action: 'update', path: 'chat', partial: { k_test2: cur.k_test2 } }, girlTok)
const g4 = await api('GET', '/api/kv?path=chat', undefined, boyTok)
ok(g4.data.value?.k_test2?.recalled === true, 'update 顶层键覆盖（撤回场景）')
// 删除（原版语义：读整值 → 删键 → set 整值覆盖）
const cur2 = (await api('GET', '/api/kv?path=chat', undefined, boyTok)).data.value
delete cur2.k_test2
await api('POST', '/api/kv', { action: 'set', path: 'chat', value: cur2 }, boyTok)
const g5 = await api('GET', '/api/kv?path=chat', undefined, boyTok)
ok(g5.data.value?.k_test2 === undefined && g5.data.value?.k_test1, 'set 覆盖删键（删除场景）')
await api('POST', '/api/kv', { action: 'set', path: 'mood/2026-08-28', value: { boy: { emoji: 'X', label: '超想你' } } }, boyTok)
await api('POST', '/api/kv', { action: 'set', path: 'mood/2026-08-27', value: { girl: { emoji: 'Y', label: '好困' } } }, girlTok)
const gp = await api('GET', '/api/kv/prefix?path=mood/', undefined, boyTok)
ok(gp.data.items['2026-08-28']?.boy?.label === '超想你' && gp.data.items['2026-08-27']?.girl?.label === '好困', 'prefix 前缀拉取')

console.log('== 4. WebSocket 实时 ==')
const wsBoy = new WebSocket(`ws://localhost:8090/ws?token=${boyTok}`)
const boyMsgs = []
wsBoy.on('message', (d) => boyMsgs.push(JSON.parse(d)))
await new Promise((r) => { wsBoy.on('open', r) })
wsBoy.send(JSON.stringify({ op: 'sub', path: 'chat' }))
const wsGirl = new WebSocket(`ws://localhost:8090/ws?token=${girlTok}`)
const girlMsgs = []
wsGirl.on('message', (d) => girlMsgs.push(JSON.parse(d)))
await new Promise((r) => { wsGirl.on('open', r) })
await sleep(300)
ok(boyMsgs.some((m) => m.event === 'presence' && m.role === 'girl' && m.online === true), '女生连接 → 男生收到 presence online')
await api('POST', '/api/kv', { action: 'push', path: 'chat', key: 'k_live1', val: { text: '实时!', sender: 'girl', ts: 200 } }, girlTok)
await sleep(400)
const kvMsg = boyMsgs.find((m) => m.event === 'kv' && m.path === 'chat')
ok(kvMsg && kvMsg.value?.k_live1?.text === '实时!', '女生写 chat → 男生实时收到 kv 推送')
wsBoy.send(JSON.stringify({ op: 'ping' }))
await sleep(200)
ok(boyMsgs.some((m) => m.event === 'pong'), 'ping→pong')

console.log('== 5. 真心话 & 杂项 ==')
const rt = await api('GET', '/api/truth/draw?category=sweet', undefined, boyTok)
ok(rt.status === 200 && rt.data.questions?.length === 1, `抽甜蜜题: ${rt.data.questions?.[0] || ''}`)
const rf = await api('POST', '/api/auth/login', { username: boyName, password: 'wrong' })
ok(rf.status !== 200, '错误密码被拒')
const rme2 = await api('GET', '/api/me', undefined, girlTok)
ok(rme2.data.couple?.members?.some((m) => m.role === 'boy' && m.online === true), 'REST 快照含在线状态')

wsBoy.close(); wsGirl.close()
await sleep(300)
console.log(`\n结果: ${pass} 通过 / ${fail} 失败`)
process.exit(fail ? 1 : 0)
