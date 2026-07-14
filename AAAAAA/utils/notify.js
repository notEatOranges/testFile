// notify.js —— 订阅消息授权封装（攒发送额度）
// requestSubscribeMessage 必须在用户 tap 上下文同步调用，不能在 await 之后。

// TODO: 去微信公众平台 → 功能 → 订阅消息 → 公共模板库，申请后填入。
//   - TMPL_CHAT ：聊天消息提醒（关键词含 昵称/内容/时间）
//   - TMPL_ANNIV：纪念日提醒  （关键词含 名称/日期/倒计时天数）
// ⚠️ 必须与云函数 cloudfunctions/sendMsg、cloudfunctions/anniversaryReminder 里的 templateId 完全一致！
const TMPL_CHAT = 'Is1-N9RbFP4UwAtGEtlHIpIbJ1edVBul5vQdstGACJQ';
const TMPL_ANNIV = 'CZjK1A6V6fXOKaiJ-TdfJCdTBMloydYLZeaF9PPITw4';
const TMPL_IDS = [TMPL_CHAT, TMPL_ANNIV].filter(id => id && !id.startsWith('PUT_'));

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
      success: resolve,
      fail(err) { console.warn('[notify] requestSubscribeMessage fail', err); resolve({}); }
    });
  });
}

module.exports = { TMPL_CHAT, TMPL_ANNIV, TMPL_IDS, requestSubscribeMessage };
