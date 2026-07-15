// notify.js —— 订阅消息授权封装（攒发送额度）+ 额度统计（授权 − 已发送 = 剩余可收）
// requestSubscribeMessage 必须在用户 tap 上下文同步调用。
const { Store } = require('./store.js');

const TMPL_CHAT = 'Is1-N9RbFP4UwAtGEtlHIpIbJ1edVBul5vQdstGACJQ';
const TMPL_ANNIV = 'CZjK1A6V6fXOKaiJ-TdfJCdTBMloydYLZeaF9PPITw4';
const TMPL_IDS = [TMPL_CHAT, TMPL_ANNIV];

// 本地授权计数（每 accept 一次 +1）
const K_CHAT = 'lh5_quota_chat', K_ANNIV = 'lh5_quota_anniv';
function bump(key) { wx.setStorageSync(key, (wx.getStorageSync(key) || 0) + 1); }

// 已发送计数存云端 kv：notifySent/{role}/{type}
// 发送方在 sendMsg 返回 push.ok 后 markSent（给接收方的额度 -1），接收方 getQuota 读它算「剩余可收」。
// ⚠️ 聊天通知由前端发起（chat send），可准确 markSent；纪念日提醒是定时触发器，前端无法感知，anniv 暂不减。
async function _sent(role, type) {
  if (!role) return 0;
  try { return (await Store.getOnce('notifySent/' + role + '/' + type)) || 0; } catch (e) { return 0; }
}
// 剩余可收次数 = 我已授权 − 对方已发给我的
async function getQuota(role) {
  const chat = Math.max(0, (wx.getStorageSync(K_CHAT) || 0) - await _sent(role, 'chat'));
  const anniv = Math.max(0, (wx.getStorageSync(K_ANNIV) || 0) - await _sent(role, 'anniv'));
  return { chat, anniv };
}
// 发送方推送成功后调：给 role 的 type 额度 -1
async function markSent(role, type) {
  if (!role || !type) return;
  try {
    const key = 'notifySent/' + role + '/' + type;
    const cur = (await Store.getOnce(key)) || 0;
    await Store.set(key, cur + 1);
  } catch (e) {}
}

/**
 * 弹出订阅授权面板（必须在 tap 上下文同步调用）。
 * @param {string[]} [ids] 默认申请全部已配置模板（最多 3 个）
 * @returns {Promise<Object>} { [tmplId]: 'accept'|'reject'|'ban'|'filter' }
 */
function requestSubscribeMessage(ids) {
  const tmplIds = (ids && ids.length) ? ids : TMPL_IDS;
  if (!tmplIds.length) {
    wx.showToast({ title: '订阅模板未配置', icon: 'none' });
    return Promise.resolve({});
  }
  return new Promise(resolve => {
    wx.requestSubscribeMessage({
      tmplIds,
      success(res) {
        // 每接受一个模板 = 为自己攒 1 条额度
        if (res[TMPL_CHAT] === 'accept') bump(K_CHAT);
        if (res[TMPL_ANNIV] === 'accept') bump(K_ANNIV);
        resolve(res);
      },
      fail(err) { console.warn('[notify] requestSubscribeMessage fail', err); resolve({}); }
    });
  });
}

module.exports = { TMPL_CHAT, TMPL_ANNIV, TMPL_IDS, requestSubscribeMessage, getQuota, markSent };
