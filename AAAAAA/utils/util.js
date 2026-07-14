// util.js —— 通用工具（从 love-h5/js/core/utils.js 移植，去掉 DOM 依赖）
// 纯函数部分（时间/id/节流/emoji/题库）几乎照搬；toast 改用小程序原生
function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDateTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${fmtTime(ts)}`;
}

function daysBetween(startDateStr) {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr + 'T00:00:00');
  const today = new Date(todayStr() + 'T00:00:00');
  return Math.max(0, Math.round((today - start) / 86400000));
}

function daysUntil(dateStr) {
  if (!dateStr) return 0;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date(todayStr() + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function throttle(fn, ms) {
  let last = 0, timer = null, lastArgs = null;
  return (...args) => {
    const now = Date.now();
    lastArgs = args;
    const remain = ms - (now - last);
    if (remain <= 0) { last = now; fn(...args); }
    else if (!timer) {
      timer = setTimeout(() => { last = Date.now(); timer = null; fn(...lastArgs); }, remain);
    }
  };
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const roleName = r => (r === 'boy' ? '他' : '她');
const roleFull = r => (r === 'boy' ? '男生' : '女生');
const peerRole = r => (r === 'boy' ? 'girl' : 'boy');

const MOODS = [
  { emoji: '🥰', label: '超想你' },
  { emoji: '😊', label: '很开心' },
  { emoji: '😘', label: '想亲亲' },
  { emoji: '🤭', label: '小确幸' },
  { emoji: '😴', label: '好困呀' },
  { emoji: '🥺', label: '求抱抱' },
  { emoji: '😤', label: '小委屈' },
  { emoji: '🥳', label: '超兴奋' },
  { emoji: '🤒', label: '不舒服' },
  { emoji: '🌧️', label: '有点丧' }
];

const TRUTH_QUESTIONS = [
  '第一次心动是什么时候？', '最喜欢我哪个瞬间？', '如果只能保留一个关于我们的回忆，你选哪个？',
  '我最让你感动的一件事是什么？', '你最想和我一起去哪里旅行？', '你觉得我们最像的一对动物是什么？',
  '上次偷偷想我是什么时候？', '如果我变成小猫，你会怎么养我？', '我们之间你最珍惜的是什么？',
  '最想对我说却一直没说出口的话？', '理想中和我的一天是怎么过的？', '你眼里我最可爱的三个缺点？',
  '未来最想和我一起完成的愿望？', '哪首歌会让你立刻想到我？', '如果今天是世界末日，你想和我做什么？',
  '你觉得我们之间最有默契的一件事？', '最喜欢我叫你什么？', '什么时候觉得「有ta真好」？'
];

function toast(msg, icon = 'none') {
  wx.showToast({ title: String(msg), icon, duration: 1800 });
}

function debounce(fn, wait = 300) {
  let t = null;
  return function (...args) {
    if (t) clearTimeout(t);
    t = setTimeout(() => { t = null; fn.apply(this, args); }, wait);
  };
}

module.exports = {
  todayStr, fmtTime, fmtDateTime, daysBetween, daysUntil,
  uid, throttle, escapeHtml, debounce,
  roleName, roleFull, peerRole,
  MOODS, TRUTH_QUESTIONS, toast
};
