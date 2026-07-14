// notify.js —— 订阅消息授权封装（攒发送额度）+ 本地额度统计
// requestSubscribeMessage 必须在用户 tap 上下文同步调用。

const TMPL_CHAT = 'Is1-N9RbFP4UwAtGEtlHIpIbJ1edVBul5vQdstGACJQ';
const TMPL_ANNIV = 'CZjK1A6V6fXOKaiJ-TdfJCdTBMloydYLZeaF9PPITw4';
const TMPL_IDS = [TMPL_CHAT, TMPL_ANNIV];

// 本地额度计数。
// ⚠️ 微信不开放「剩余可收次数」查询，这里统计的是「你已授权 accept 的累计次数」，
//    作为可用额度的乐观展示；对方给你发消息会消耗你的真实额度，但本地无法感知扣减。
const K_CHAT = 'lh5_quota_chat', K_ANNIV = 'lh5_quota_anniv';
function bump(key) { wx.setStorageSync(key, (wx.getStorageSync(key) || 0) + 1); }
function getQuota() {
  return { chat: wx.getStorageSync(K_CHAT) || 0, anniv: wx.getStorageSync(K_ANNIV) || 0 };
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

module.exports = { TMPL_CHAT, TMPL_ANNIV, TMPL_IDS, requestSubscribeMessage, getQuota };
