/* ============================================================
   极简 hash 路由
   - 轻量页：index.html 内 <section id="view-{name}" class="view">，hash #/{name} 显示
   - 重页（heart / catfish）：在 #iframe-host 里加载独立 HTML（离开时清空，停渲染）
   每个 view 可注册 onEnter / onLeave。
   ============================================================ */

const views = Object.create(null);
let current = null;

export function define(name, opts = {}) { views[name] = opts; }
export function go(name) { location.hash = `#/${name}`; }
export function currentName() { return current; }

export function start() {
  window.addEventListener("hashchange", apply);
  apply();
}

function apply() {
  const name = (location.hash.match(/^#\/(\w+)/) || [])[1] || "home";
  const view = views[name] || views.home;

  // 离开旧视图
  if (current && views[current] && views[current].onLeave) {
    try { views[current].onLeave(); } catch (e) { console.warn(e); }
  }
  document.querySelectorAll(".view").forEach(s => s.classList.remove("active"));

  const host = document.getElementById("iframeHost");
  if (view.iframe) {
    // 重页：显示 iframe 容器
    if (host.dataset.src !== view.iframe) {
      host.innerHTML = "";
      const f = document.createElement("iframe");
      f.src = view.iframe;
      f.setAttribute("allow", "autoplay; fullscreen");
      if (view.heart) f.dataset.heart = "1";
      host.appendChild(f);
      host.dataset.src = view.iframe;
    }
    host.classList.add("active");
  } else {
    // 轻量页：清掉重页 iframe（停止其渲染），显示对应 section
    host.classList.remove("active");
    host.innerHTML = "";
    host.dataset.src = "";
    const el = document.getElementById(`view-${name}`);
    if (el) el.classList.add("active");
  }

  const titleEl = document.getElementById("topTitle");
  const backBtn = document.getElementById("backBtn");
  if (titleEl) titleEl.textContent = view.title || "";
  if (backBtn) backBtn.style.display = name === "home" ? "none" : "";

  current = name;
  if (view.onEnter) {
    try { view.onEnter(); } catch (e) { console.warn(e); }
  }
  window.scrollTo(0, 0);
}
