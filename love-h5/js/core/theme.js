/* ============================================================
   主题切换：3 套马卡龙（sakura / mint / lavender）
   持久化 localStorage(lh5-theme)，切换即时生效（data-theme + CSS 变量），
   并 postMessage 给 heart-3d 的 iframe 让其跟随。
   切换按钮位于顶栏右上角（#themeBtn），弹层向下展开。
   ============================================================ */

const KEY = "lh5-theme";
export const THEMES = [
  { id: "sakura", name: "樱花粉", c1: "#ff7aa2", c2: "#ffd1dc" },
  { id: "mint", name: "薄荷绿", c1: "#5bb89e", c2: "#b8e6cc" },
  { id: "lavender", name: "薰衣草紫", c1: "#9b7fd4", c2: "#d2c2ec" },
  { id: "peach", name: "蜜桃橙", c1: "#ff9a6c", c2: "#ffd0b8" },
  { id: "babyblue", name: "奶蓝", c1: "#6db4e8", c2: "#b3d9f5" },
  { id: "lemon", name: "奶酪黄", c1: "#e8b94d", c2: "#ffe6a3" },
  { id: "berry", name: "莓莓红", c1: "#e87090", c2: "#ffc6d2" },
  { id: "cocoa", name: "可可棕", c1: "#b08968", c2: "#dccab4" },
];

export function getTheme() {
  const t = localStorage.getItem(KEY);
  return THEMES.some(x => x.id === t) ? t : "sakura";
}

export function setTheme(name) {
  localStorage.setItem(KEY, name);
  document.documentElement.setAttribute("data-theme", name);
  broadcastToHeart();
  document.dispatchEvent(new CustomEvent("themechange", { detail: name }));
  document.querySelectorAll(".theme-opt").forEach(el => {
    el.classList.toggle("active", el.dataset.theme === name);
  });
}

/** 把主题（始终映射为亮色）同步进 heart-3d iframe */
function broadcastToHeart() {
  document.querySelectorAll("iframe[data-heart]").forEach(f => {
    try { f.contentWindow.postMessage({ type: "set-theme", theme: "light" }, "*"); } catch {}
  });
}

/** 从 CSS 变量读取颜色（游戏 Canvas 取色用） */
export function themeColor(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

/** 初始化主题切换器（按钮在顶栏右上角 #themeBtn，弹层向下展开） */
export function initSwitcher() {
  const btn = document.getElementById("themeBtn");
  const pop = document.getElementById("themePop");
  if (!btn || !pop) return;
  btn.addEventListener("click", e => { e.stopPropagation(); pop.classList.toggle("show"); });
  document.addEventListener("click", () => pop.classList.remove("show"));
  pop.addEventListener("click", e => e.stopPropagation());
  pop.querySelectorAll(".theme-opt").forEach(el => {
    el.addEventListener("click", () => setTheme(el.dataset.theme));
  });
  setTheme(getTheme()); // 应用当前 + 高亮
}
