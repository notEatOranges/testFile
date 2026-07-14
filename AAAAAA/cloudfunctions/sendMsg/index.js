/*
 * @Author: 
 * @LastEditors: 
 * @Date: 2026-07-14 17:24:57
 * @LastEditTime: 2026-07-14 18:29:17
 * @FilePath: /AAAAAA/cloudfunctions/sendMsg/index.js
 */
// sendMsg —— 写 chat 消息 + 给对方发订阅消息通知
// 取代 chat 场景下的 Store.push('chat')：既写 kv（保持 watch 兼容），又推订阅消息。
// sender role 由 OPENID 反查 couples.members 确定，不信任客户端传入。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const KV = 'kv', COUPLES = 'couples', USERS = 'users';

// TODO: 替换为微信公众平台申请到的「聊天消息」订阅模板 ID（与 utils/notify.js 的 TMPL_CHAT 一致）
const TMPL_ID = 'Is1-N9RbFP4UwAtGEtlHIpIbJ1edVBul5vQdstGACJQ';
// 开发版 developer / 体验版 trial / 正式上线改 formal
const MP_STATE = 'formal';

function peerRole(r) { return r === 'boy' ? 'girl' : 'boy'; }
function pad(n) { return String(n).padStart(2, '0'); }
function fmtTime(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

exports.main = async (event) => {
  const { coupleId, text, ts } = event;
  const openid = cloud.getWXContext().OPENID;
  if (!coupleId || text == null) return { ok: false, reason: 'bad_args' };

  // 1) 反查 couple：确定 sender role + peer openid
  const c = await db.collection(COUPLES).where({ coupleId }).limit(1).get();
  const couple = c.data[0];
  if (!couple) return { ok: false, reason: 'couple_not_found' };
  const members = couple.members || {};
  const senderRole = members.boy === openid ? 'boy' : (members.girl === openid ? 'girl' : null);
  if (!senderRole) return { ok: false, reason: 'not_member' };
  const peerOpenid = members[peerRole(senderRole)];
  if (!peerOpenid) return { ok: false, reason: 'peer_not_paired' };

  // 2) 写 kv chat（与 kvWrite push 等价，保证 store.js watch/onList/toList 全兼容）
  const key = `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const val = { sender: senderRole, text: String(text), ts: ts || Date.now() };
  const kvCol = db.collection(KV);
  const existing = await kvCol.where({ room: coupleId, path: 'chat' }).limit(1).get();
  if (existing.data.length) {
    await kvCol.doc(existing.data[0]._id).update({ data: { ts: Date.now(), [`value.${key}`]: val } });
  } else {
    await kvCol.add({ data: { room: coupleId, path: 'chat', value: { [key]: val }, ts: Date.now() } });
  }

  // 3) 给对方发订阅消息（失败静默，不阻断消息写入）
  if (TMPL_ID.startsWith('PUT_')) return { ok: true, notify: 'tmpl_not_configured' };
  let peerNick = '另一半';
  try {
    const pu = await db.collection(USERS).where({ openid: peerOpenid }).limit(1).get();
    if (pu.data.length && pu.data[0].nick) peerNick = pu.data[0].nick;
  } catch (e) {}

  try {
    await cloud.openapi.subscribeMessage.send({
      touser: peerOpenid,
      templateId: TMPL_ID,
      page: 'packageFunc/chat/chat',
      miniprogramState: MP_STATE,
      lang: 'zh_CN',
      // ⚠️ 下面 key 必须与你申请的模板关键词一一对应（常见：thing1=昵称 thing2=内容 time3=时间）
      data: {
        thing1: { value: peerNick.slice(0, 20) },
        thing2: { value: String(text).slice(0, 20) },
        time3: { value: fmtTime(val.ts) }
      }
    });
  } catch (err) {
    // 43101=未订阅/额度用尽, 47003=模板参数不符, 40037=模板id错 —— 全静默
    console.warn('[sendMsg] subscribe failed', err && err.errCode, err && err.errMsg);
  }
  return { ok: true };
};
