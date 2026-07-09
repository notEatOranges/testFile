/* ============================================================
   通用工具：时间、id、节流、emoji/题库、toast
   ============================================================ */

/** 今天日期字符串 YYYY-MM-DD（本地时区） */
export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 时间戳 → HH:mm */
export function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 时间戳 → MM-DD HH:mm */
export function fmtDateTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${fmtTime(ts)}`;
}

/** 两个 YYYY-MM-DD 之间的整天数（含起止逻辑：从 startDate 到今天） */
export function daysBetween(startDateStr) {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr + "T00:00:00");
  const today = new Date(todayStr() + "T00:00:00");
  return Math.max(0, Math.round((today - start) / 86400000));
}

/** 距离某个 YYYY-MM-DD 还有几天（负数表示已过去） */
export function daysUntil(dateStr) {
  if (!dateStr) return 0;
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date(todayStr() + "T00:00:00");
  return Math.round((target - today) / 86400000);
}

/** 简单随机 id（本地降级模式用；Firebase 模式用 SDK 的 push key） */
export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 节流：每隔 ms 毫秒最多执行一次（用于游戏位置广播） */
export function throttle(fn, ms) {
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

export function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/** 身份名 / 对方身份 */
export const roleName = r => (r === "boy" ? "他" : "她");
export const roleFull = r => (r === "boy" ? "男生" : "女生");
export const peerRole = r => (r === "boy" ? "girl" : "boy");

/** 心情 emoji 列表 */
export const MOODS = [
  { emoji: "🥰", label: "超想你" },
  { emoji: "😊", label: "很开心" },
  { emoji: "😘", label: "想亲亲" },
  { emoji: "🤭", label: "小确幸" },
  { emoji: "😴", label: "好困呀" },
  { emoji: "🥺", label: "求抱抱" },
  { emoji: "😤", label: "小委屈" },
  { emoji: "🥳", label: "超兴奋" },
  { emoji: "🤒", label: "不舒服" },
  { emoji: "🌧️", label: "有点丧" },
];

/** 真心话题库 */
export const TRUTH_QUESTIONS = [
  "第一次心动是什么时候？",
  "最喜欢我哪个瞬间？",
  "如果只能保留一个关于我们的回忆，你选哪个？",
  "我最让你感动的一件事是什么？",
  "你最想和我一起去哪里旅行？",
  "你觉得我们最像的一对动物是什么？",
  "上次偷偷想我是什么时候？",
  "如果我变成小猫，你会怎么养我？",
  "我们之间你最珍惜的是什么？",
  "最想对我说却一直没说出口的话？",
  "理想中和我的一天是怎么过的？",
  "你眼里我最可爱的三个缺点？",
  "未来最想和我一起完成的愿望？",
  "哪首歌会让你立刻想到我？",
  "如果今天是世界末日，你想和我做什么？",
  "你觉得我们之间最有默契的一件事？",
  "最喜欢我叫你什么？",
  "什么时候觉得「有ta真好」？",
];

/** 全局 toast 提示 */
export function toast(msg, ms = 1800) {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; }, ms - 300);
  setTimeout(() => el.remove(), ms);
}

/** 按钮通用 loading：执行 fn 期间按钮转圈 + 禁用，结束（无论成败）恢复。
 *  fn 可以是同步或异步；返回 fn 的返回值。 */
export function withLoading(btn, fn, loadingText = "处理中…") {
  if (!btn) return fn();
  const html = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="ri-loader-4-line spin"></i> ${loadingText}`;
  const restore = () => { btn.disabled = false; btn.innerHTML = html; };
  let r;
  try { r = fn(); } catch (e) { restore(); throw e; }
  return Promise.resolve(r).then(v => { restore(); return v; }, e => { restore(); throw e; });
}
