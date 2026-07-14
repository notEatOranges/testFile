// updateProfile 云函数 —— 保存昵称/头像（按 openid）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const USERS = 'users';

exports.main = async (event) => {
  const { nick, avatar } = event;
  const openid = cloud.getWXContext().OPENID;
  const u = await db.collection(USERS).where({ openid }).limit(1).get();
  if (!u.data.length) return { ok: false, reason: 'no_user' };
  await db.collection(USERS).doc(u.data[0]._id).update({
    data: { nick: nick || '', avatar: avatar || '', updatedAt: Date.now() }
  });
  return { ok: true };
};
