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

// 真心话分类（功能4）：客户端兜底题库；完整题库在云函数 truthQuestions（联网找题，可免发版扩容）
const TRUTH_CATS = {
  icebreak:   { name: '破冰', icon: 'chat' },
  sweet:      { name: '甜蜜', icon: 'heart' },
  deep:       { name: '深度', icon: 'user' },
  adventure:  { name: '冒险', icon: 'flag' },
  wilder:     { name: '脑洞', icon: 'bulletpoint' }
};
const TRUTH_BANK = {
  icebreak: ['最近一次发自内心的笑是因为什么？', '今天最想分享的一件小事？', '用一个词形容此刻的心情？', '最近循环最多的一首歌？', '你最怕的一种食物？'],
  sweet: ['第一次心动是什么时候？', '最喜欢我哪个瞬间？', '上次偷偷想我是什么时候？', '最喜欢我叫你什么？', '什么时候觉得「有ta真好」？'],
  deep: ['在亲密关系里最大的恐惧是什么？', '你觉得我们之间最需要改进的一点？', '有没有隐瞒过对方的事？', '未来三年最想和我一起完成什么？', '你最看重伴侣的哪个品质？'],
  adventure: ['给对方打个电话只说一句情话', '模仿对方的一句口头禅', '用最肉麻的语气说一段话', '闭上眼让对方画一笔在你脸上', '发一条朋友圈只对ta可见'],
  wilder: ['如果世界只剩我们俩，第一天做什么？', '变成小猫你会怎么粘我？', '我们能穿越，想去哪一天？', '如果失忆只能记一个人，你选谁？', '用一种动物形容我们的关系？']
};

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
  MOODS, TRUTH_QUESTIONS, TRUTH_CATS, TRUTH_BANK, toast
};
