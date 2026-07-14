// joinCouple 云函数 —— 凭邀请码加入情侣空间（配对）
// 校验：邀请码有效 + 自己未配对 + 有空槽位。占空槽，绑定到自己。
// 同时往 kv 写自己 presence，让创建方 watch 到"对方已加入"。
// 注：1v1 情侣场景并发极低，空槽判定先简单处理；后续如需严格可上事务。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const USERS = 'users';
const COUPLES = 'couples';
const KV = 'kv';

function peerRole(r) { return r === 'boy' ? 'girl' : 'boy'; }

exports.main = async (event) => {
  const inviteCode = String(event.inviteCode || '').trim().toUpperCase();
  const openid = cloud.getWXContext().OPENID;
  const now = Date.now();

  if (!inviteCode) return { ok: false, reason: 'empty' };

  const u = await db.collection(USERS).where({ openid }).limit(1).get();
  const user = u.data[0];
  if (!user) return { ok: false, reason: 'no_user' };
  if (user.coupleId) return { ok: false, reason: 'already_in_couple', coupleId: user.coupleId };

  const c = await db.collection(COUPLES).where({ inviteCode }).limit(1).get();
  const couple = c.data[0];
  if (!couple) return { ok: false, reason: 'invalid_code' };

  // 防止加入自己建的空间（创建方已在 members 里）
  const m = couple.members || {};
  let role = null;
  if (!m.boy) role = 'boy';
  else if (!m.girl) role = 'girl';
  else return { ok: false, reason: 'full' };
  if (m[role] === openid) return { ok: false, reason: 'self' };

  await db.collection(COUPLES).doc(couple._id).update({ data: { [`members.${role}`]: openid } });
  await db.collection(USERS).doc(user._id).update({ data: { coupleId: couple.coupleId, role, updatedAt: now } });

  // kv 写自己 presence（创建方订阅 members/{peer} 会立刻收到）
  await db.collection(KV).add({
    data: { room: couple.coupleId, path: `members/${role}`, value: { online: false, lastSeen: 0, openid, nick: user.nick, joinedAt: now }, ts: now }
  });

  return { ok: true, coupleId: couple.coupleId, role };
};
