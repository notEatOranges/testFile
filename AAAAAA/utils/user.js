// user.js —— 用户体系身份层（封装 login/create/join/profile/leave 云函数 + 缓存当前用户）
const room = require('./room.js');

let currentUser = null;   // { openid, nick, avatar, coupleId, role }

async function login() {
  const res = await wx.cloud.callFunction({ name: 'login' });
  currentUser = res.result.user || null;
  if (res.result.inviteCode) {
    if (currentUser) currentUser.inviteCode = res.result.inviteCode;
    wx.setStorageSync('lh5_invite', res.result.inviteCode);
  }
  return currentUser;
}
function getUser() { return currentUser; }
function isPaired() { return !!(currentUser && currentUser.coupleId); }

async function saveProfile({ nick, avatar }) {
  await wx.cloud.callFunction({ name: 'updateProfile', data: { nick, avatar } });
  if (currentUser) { currentUser.nick = nick; currentUser.avatar = avatar; }
}

async function createCouple(role) {
  const res = await wx.cloud.callFunction({ name: 'createCouple', data: { role } });
  const r = res.result;
  if (r.ok && currentUser) {
    currentUser.coupleId = r.coupleId;
    currentUser.role = role;
    wx.setStorageSync('lh5_invite', r.inviteCode);   // 缓存邀请码，主页可随时查看
  }
  return r;
}

async function joinCouple(inviteCode) {
  const res = await wx.cloud.callFunction({ name: 'joinCouple', data: { inviteCode } });
  const r = res.result;
  if (r.ok && currentUser) { currentUser.coupleId = r.coupleId; currentUser.role = r.role; }
  return r;
}

/** 退出情侣空间：云端解绑 + 清本地缓存 */
async function leaveCouple() {
  try { await wx.cloud.callFunction({ name: 'leaveCouple' }); } catch (e) {}
  if (currentUser) { currentUser.coupleId = null; currentUser.role = null; }
  wx.removeStorageSync('lh5_invite');
}

function applyToRoom() {
  if (!currentUser) return;
  room.setUserContext({
    openid: currentUser.openid,
    coupleId: currentUser.coupleId,
    role: currentUser.role
  });
}

module.exports = {
  login, getUser, isPaired, saveProfile, createCouple, joinCouple, leaveCouple, applyToRoom
};
