// login 云函数 —— 换取 openid + 用户记录（首次自动建档）
// 已配对的创建方额外返回 inviteCode，让客户端主页能显示邀请码（回补老用户）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const USERS = 'users';
const COUPLES = 'couples';

exports.main = async () => {
  const openid = cloud.getWXContext().OPENID;
  const found = await db.collection(USERS).where({ openid }).limit(1).get();
  let user;
  if (found.data.length) {
    user = found.data[0];
  } else {
    const now = Date.now();
    const r = await db.collection(USERS).add({
      data: { openid, nick: '', avatar: '', coupleId: null, role: null, createdAt: now, updatedAt: now }
    });
    user = { _id: r._id, openid, nick: '', avatar: '', coupleId: null, role: null };
  }

  // 已配对且本人是创建方 → 带回邀请码
  let inviteCode = null;
  if (user.coupleId) {
    const c = await db.collection(COUPLES).where({ coupleId: user.coupleId }).limit(1).get();
    const couple = c.data[0];
    if (couple && couple.createdBy === openid) inviteCode = couple.inviteCode || null;
  }

  return { openid, user, inviteCode };
};
