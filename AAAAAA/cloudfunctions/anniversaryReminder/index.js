// anniversaryReminder —— 定时（每日 9:00）扫描纪念日，当天/提前1天给双方发订阅消息
// 触发器见 config.json。需在微信公众平台申请「纪念日提醒」模板，填 TMPL_ID（与 utils/notify.js TMPL_ANNIV 一致）。
// 云函数运行在 UTC，下面按 CST(UTC+8) 计算日期，保证"今天/明天"对中国用户正确。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const COUPLES = 'couples', KV = 'kv';

// 「纪念日提醒」订阅模板 ID（= utils/notify.js 的 TMPL_ANNIV，两处必须一致）
const TMPL_ID = 'CZjK1A6V6fXOKaiJ-TdfJCdTBMloydYLZeaF9PPITw4';
const MP_STATE = 'developer'; // 开发版 developer / 体验版 trial / 正式 formal
const NOTIFY_DAYS = [0, 1];   // 0=当天, 1=提前一天

// 「纪念日提醒」模板的 4 个关键词（已按公众平台模板编号 28259 的 {{}} 实名抄对，勿改）：
//   {{thing5.DATA}}=纪念日名称  {{time6.DATA}}=纪念日时间  {{time7.DATA}}=下次时间  {{thing4.DATA}}=备注
const KW = {
  name: 'thing5',    // 纪念日名称
  date: 'time6',     // 纪念日时间
  next: 'time7',     // 下次时间
  remark: 'thing4'   // 备注
};

const CST = 8 * 3600 * 1000;
function pad(n) { return String(n).padStart(2, '0'); }
function cstDayMs(dateStr) { return new Date(dateStr + 'T00:00:00+08:00').getTime(); }
function todayCSTStr() {
  const d = new Date(Date.now() + CST);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function daysUntil(dateStr) {
  return Math.round((cstDayMs(dateStr) - cstDayMs(todayCSTStr())) / 86400000);
}

exports.main = async () => {
  if (TMPL_ID.startsWith('PUT_')) return { ok: false, reason: 'tmpl_not_configured' };
  const couples = (await db.collection(COUPLES).limit(100).get()).data;
  let pushed = 0;
  for (const cp of couples) {
    const members = cp.members || {};
    const openids = [members.boy, members.girl].filter(Boolean);
    if (!openids.length) continue;

    const ev = await db.collection(KV).where({ room: cp.coupleId, path: 'anniversary/events' }).limit(1).get();
    const value = ev.data[0] && ev.data[0].value;
    const events = value ? Object.values(value) : [];

    for (const e of events) {
      if (!e || !e.date) continue;
      const n = daysUntil(e.date);
      if (!NOTIFY_DAYS.includes(n)) continue;
      const label = n === 0 ? '就是今天' : '就在明天';
      for (const oid of openids) {
        try {
          await cloud.openapi.subscribeMessage.send({
            touser: oid, templateId: TMPL_ID, page: 'packageFunc/days/days', miniprogramState: MP_STATE, lang: 'zh_CN',
            data: {
              [KW.name]: { value: String(e.title || '纪念日').slice(0, 20) }, // 纪念日名称
              [KW.date]: { value: e.date },                                    // 纪念日时间
              [KW.next]: { value: e.date },                                    // 下次时间
              [KW.remark]: { value: label }                                    // 备注（就是今天/就在明天）
            }
          });
          pushed++;
        } catch (err) {
          console.warn('[anniv] send fail', oid, err && err.errCode, err && err.errMsg);
        }
      }
    }
  }
  return { ok: true, pushed };
};
