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

// 「聊天消息通知」订阅模板 ID（= utils/notify.js 的 TMPL_CHAT，两处必须一致）
const TMPL_ID = 'Is1-N9RbFP4UwAtGEtlHIpIbJ1edVBul5vQdstGACJQ';
// 开发版 developer / 体验版 trial / 正式上线改 formal
const MP_STATE = 'trial';

// 「聊天消息通知」模板的 5 个关键词（已按公众平台模板编号 32400 的 {{}} 实名抄对，勿改）：
//   {{thing1.DATA}}=消息来自  {{time6.DATA}}=发送时间  {{thing8.DATA}}=消息标题
//   {{time9.DATA}}=发布时间   {{thing10.DATA}}=消息内容
const KW = {
  from: 'thing1',     // 消息来自（发送者昵称）
  stime: 'time6',     // 发送时间
  title: 'thing8',    // 消息标题
  ptime: 'time9',     // 发布时间
  content: 'thing10'  // 消息内容
};

function peerRole(r) { return r === 'boy' ? 'girl' : 'boy'; }
function pad(n) { return String(n).padStart(2, '0'); }
function fmtTime(ts) {
  const d = new Date(ts);
  // time 类型关键词按 YYYY-MM-DD HH:mm:ss 传，最稳
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

exports.main = async (event) => {
  const { coupleId, text, ts, media } = event;
  const openid = cloud.getWXContext().OPENID;
  if (!coupleId || (text == null && !media)) return { ok: false, reason: 'bad_args' };

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
  const val = { sender: senderRole, ts: ts || Date.now() };
  if (text != null) val.text = String(text);
  if (media && media.fileID) {                 // 图片/文件/语音消息
    val.type = media.kind;                      // 'image' | 'file' | 'voice'
    val.fileID = media.fileID;
    if (media.kind === 'image') {
      if (media.sticker) val.sticker = true;
      if (media.w) val.w = media.w;
      if (media.h) val.h = media.h;
    } else if (media.kind === 'file') {
      if (media.name != null) val.name = media.name;
      if (media.size != null) val.size = media.size;
    } else if (media.kind === 'voice') {
      if (media.duration != null) val.duration = media.duration; // 毫秒
    }
  }
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

  let push = { ok: true };
  try {
    await cloud.openapi.subscribeMessage.send({
      touser: peerOpenid,
      templateId: TMPL_ID,
      page: 'packageFunc/chat/chat',
      miniprogramState: MP_STATE,
      lang: 'zh_CN',
      data: {
        [KW.from]: { value: peerNick.slice(0, 20) },            // 消息来自
        [KW.stime]: { value: fmtTime(val.ts) },                 // 发送时间
        [KW.title]: { value: '新消息' },                          // 消息标题
        [KW.ptime]: { value: fmtTime(val.ts) },                 // 发布时间
        [KW.content]: { value: (text != null ? String(text) : (val.type === 'image' ? '[图片]' : val.type === 'file' ? '[文件]' : val.type === 'voice' ? '[语音]' : '')).slice(0, 20) }      // 消息内容（图片/文件/语音用占位词）
      }
    });
  } catch (err) {
    // 43101=未订阅/额度用尽, 47003=模板参数不符, 40037=模板id错
    push = { ok: false, errCode: err && err.errCode, errMsg: err && err.errMsg };
    console.warn('[sendMsg] subscribe failed', err && err.errCode, err && err.errMsg);
  }
  return { ok: true, push };
};
