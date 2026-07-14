// createCouple 云函数 —— 建情侣空间（单一空间模型）
// 流程：建空间者选自己身份 role(boy/girl) → 建 couples 记录 + 生成邀请码 → 绑定到自己
// 同时往 kv 写自己的 presence 占位，让对端加入后能被 watch 感知。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const USERS = 'users';
const COUPLES = 'couples';
const KV = 'kv';

function peerRole(r) { return r === 'boy' ? 'girl' : 'boy'; }
function code(n) {
  const s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混 I O 0 1
  let r = '';
  for (let i = 0; i < n; i++) r += s[Math.floor(Math.random() * s.length)];
  return r;
}

exports.main = async (event) => {
  const role = event.role === 'girl' ? 'girl' : 'boy';   // 默认 boy
  const openid = cloud.getWXContext().OPENID;
  const now = Date.now();

  const u = await db.collection(USERS).where({ openid }).limit(1).get();
  const user = u.data[0];
  if (!user) return { ok: false, reason: 'no_user' };     // 应先 login
  if (user.coupleId) return { ok: false, reason: 'already_in_couple', coupleId: user.coupleId };

  // 生成不重复的 coupleId + inviteCode（极小概率重复，重试一次）
  let coupleId = 'c_' + code(10);
  let inviteCode = code(6);
  const dup = await db.collection(COUPLES).where({ inviteCode }).limit(1).get();
  if (dup.data.length) inviteCode = code(6);

  await db.collection(COUPLES).add({
    data: { coupleId, inviteCode, members: { [role]: openid, [peerRole(role)]: null }, createdBy: openid, createdAt: now }
  });
  await db.collection(USERS).doc(user._id).update({ data: { coupleId, role, updatedAt: now } });

  // kv 占位：自己的 presence（对方加入前可被 watch 到"另一半还空着"）
  await db.collection(KV).add({
    data: { room: coupleId, path: `members/${role}`, value: { online: false, lastSeen: 0, openid, joinedAt: now }, ts: now }
  });

  return { ok: true, coupleId, inviteCode, role };
};
