// anniv.js —— 纪念日下次发生日 + 倒数（功能2）
// 客户端展示与云函数推送各有一份 nextOccur（云函数运行在 Node，不能 require 本文件）。
const { daysUntil } = require('./util.js');

// 类型元数据：name + t-icon 名（遵循「图标用 t-icon」铁律）
const TYPES = {
  anniversary: { name: '纪念日', icon: 'heart' },
  birthday:    { name: '生日',   icon: 'gift' },
  first:       { name: '第一次', icon: 'star' },
  festival:    { name: '节日',   icon: 'calendar' },
  countdown:   { name: '倒计时', icon: 'time' }
};
const TYPE_KEYS = Object.keys(TYPES);

const RECURRENCE = {
  once:    { name: '单次' },
  yearly:  { name: '每年' },
  monthly: { name: '每月' }
};
const RECURRENCE_KEYS = Object.keys(RECURRENCE);

const ADVANCE_OPTIONS = [
  { d: 0, label: '当天' },
  { d: 1, label: '提前1天' },
  { d: 3, label: '提前3天' },
  { d: 7, label: '提前7天' }
];

function pad(n) { return String(n).padStart(2, '0'); }
function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function todayDate() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

/** 下一次发生日 'YYYY-MM-DD'。once=原值；yearly/monthly=向前滚到 ≥今天 */
function nextOccur(dateStr, recurrence, from) {
  if (!dateStr) return '';
  recurrence = recurrence || 'once';
  const base = new Date(dateStr + 'T00:00:00');
  if (recurrence === 'once') return dateStr;
  const t = from ? new Date(from.getFullYear(), from.getMonth(), from.getDate()) : todayDate();
  if (recurrence === 'yearly') {
    let y = t.getFullYear();
    let dd = base.getDate();
    if (base.getMonth() === 1 && dd === 29 && !isLeap(y)) dd = 28;   // 2-29 闰年兜底
    let c = new Date(y, base.getMonth(), dd);
    if (c < t) {
      y += 1;
      if (base.getMonth() === 1 && base.getDate() === 29 && !isLeap(y)) dd = 28; else dd = base.getDate();
      c = new Date(y, base.getMonth(), dd);
    }
    return ymd(c);
  }
  if (recurrence === 'monthly') {
    let y = t.getFullYear(), m = t.getMonth();
    let dd = Math.min(base.getDate(), daysInMonth(y, m));
    let c = new Date(y, m, dd);
    if (c < t) {
      m += 1; if (m > 11) { m = 0; y += 1; }
      dd = Math.min(base.getDate(), daysInMonth(y, m));
      c = new Date(y, m, dd);
    }
    return ymd(c);
  }
  return dateStr;
}

/** 距下一次发生的天数（负=已过，0=今天，正=未来） */
function daysToNext(event, from) {
  if (!event || !event.date) return null;
  const next = nextOccur(event.date, event.recurrence, from);
  return daysUntil(next);
}

/** 给展示用的文案 */
function countdownText(event, from) {
  const n = daysToNext(event, from);
  if (n == null) return '';
  if (event.recurrence === 'once' && n < 0) return Math.abs(n) + ' 天前';
  if (n === 0) return '就是今天';
  return n > 0 ? ('还有 ' + n + ' 天') : (Math.abs(n) + ' 天前');
}

module.exports = {
  TYPES, TYPE_KEYS, RECURRENCE, RECURRENCE_KEYS, ADVANCE_OPTIONS,
  nextOccur, daysToNext, countdownText
};
