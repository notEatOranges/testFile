// anniversaryReminder —— 定时（每日 9:00 CST）扫描纪念日，命中「提前天数」给双方发订阅消息
// 触发器见 config.json。模板 ID = utils/notify.js 的 TMPL_ANNIV。
// 功能2 改造：支持按年/按月循环（生日、周年明年也触发）+ 每个事件自定义 advanceDays。
// 云函数运行在 UTC，下面按 CST(UTC+8) 算日期，保证"今天/明天"对中国用户正确。
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const COUPLES = 'couples', KV = 'kv';

// 「纪念日提醒」订阅模板 ID（= utils/notify.js 的 TMPL_ANNIV，两处必须一致）
const TMPL_ID = 'CZjK1A6V6fXOKaiJ-TdfJCdTBMloydYLZeaF9PPITw4';
const MP_STATE = 'developer'; // 开发版 developer / 体验版 trial / 正式 formal
const DEFAULT_ADVANCE = [0, 1]; // 事件未配 advanceDays 时的默认提前天数

// 「纪念日提醒」模板的 4 个关键词（公众平台模板编号 28259，勿改）：
//   {{thing5.DATA}}=纪念日名称  {{time6.DATA}}=纪念日时间  {{time7.DATA}}=下次时间  {{thing4.DATA}}=备注
const KW = { name: 'thing5', date: 'time6', next: 'time7', remark: 'thing4' };

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
function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
function dim(y, m) { return new Date(y, m + 1, 0).getDate(); }   // m 0-based → 该月天数

/** 下一次发生日 'YYYY-MM-DD'（CST）。用 ymd 整数比较，规避 Date 时 zone 陷阱。 */
function nextOccur(dateStr, recurrence) {
  recurrence = recurrence || 'once';
  if (!dateStr) return '';
  const p = dateStr.split('-');
  const bm = +p[1] - 1, bd = +p[2];
  if (recurrence === 'once') return dateStr;
  const t = todayCSTStr().split('-');
  const ty = +t[0], tm = +t[1] - 1, td = +t[2];
  const tInt = ty * 10000 + tm * 100 + td;
  if (recurrence === 'yearly') {
    let y = ty, dd = (bm === 1 && bd === 29 && !isLeap(y)) ? 28 : bd;
    if (y * 10000 + bm * 100 + dd < tInt) { y += 1; dd = (bm === 1 && bd === 29 && !isLeap(y)) ? 28 : bd; }
    return `${y}-${pad(bm + 1)}-${pad(dd)}`;
  }
  if (recurrence === 'monthly') {
    let y = ty, m = tm, dd = Math.min(bd, dim(y, m));
    if (y * 10000 + m * 100 + dd < tInt) { m += 1; if (m > 11) { m = 0; y += 1; } dd = Math.min(bd, dim(y, m)); }
    return `${y}-${pad(m + 1)}-${pad(dd)}`;
  }
  return dateStr;
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
      const next = nextOccur(e.date, e.recurrence);
      const n = daysUntil(next);
      const advance = (e.advanceDays && e.advanceDays.length) ? e.advanceDays : DEFAULT_ADVANCE;
      if (!advance.includes(n)) continue;
      const label = n === 0 ? '就是今天' : (n === 1 ? '就在明天' : '还有 ' + n + ' 天');
      for (const oid of openids) {
        try {
          await cloud.openapi.subscribeMessage.send({
            touser: oid, templateId: TMPL_ID, page: 'packageFunc/days/days', miniprogramState: MP_STATE, lang: 'zh_CN',
            data: {
              [KW.name]: { value: String(e.title || '纪念日').slice(0, 20) },
              [KW.date]: { value: next },
              [KW.next]: { value: next },
              [KW.remark]: { value: label }
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
