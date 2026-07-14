// leaveCouple 云函数 —— 退出情侣空间（解除配对）
// 清 users.coupleId/role + 把自己从 couples.members 槽位移除
// 退出后该用户变未配对，可重新建/加入空间；对方成员槽变空
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const USERS = 'users';
const COUPLES = 'couples';

exports.main = async () => {
  const openid = cloud.getWXContext().OPENID;
  const u = await db.collection(USERS).where({ openid }).limit(1).get();
  const user = u.data[0];
  if (!user) return { ok: false, reason: 'no_user' };

  const now = Date.now();
  // 释放 couples 成员槽
  if (user.coupleId && user.role) {
    const c = await db.collection(COUPLES).where({ coupleId: user.coupleId }).limit(1).get();
    if (c.data[0]) {
      await db.collection(COUPLES).doc(c.data[0]._id).update({ data: { [`members.${user.role}`]: null } });
    }
  }
  // 清自己的绑定
  await db.collection(USERS).doc(user._id).update({ data: { coupleId: null, role: null, updatedAt: now } });
  return { ok: true };
};
