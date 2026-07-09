/* ============================================================
   触摸输入 —— 整块画布作虚拟摇杆
   - 按下记起点，拖动方向=移动方向，距离=速度，松手停
   - 方向归一化向量 (dx,dy)，强度 0~1（按 60px 满杆），引擎乘定速
   - 兼容鼠标（桌面调试）：mousedown/move/up
 ============================================================ */

/** 绑定到 canvas，onChange(dir) 回调；返回解绑函数 */
export function bindInput(canvas, onChange) {
  let active = false;
  let start = null;

  const MAX = 60;   // 60px = 满杆（强度 1）

  function down(x, y) {
    active = true;
    start = { x, y };
    onChange(0, 0);
  }
  function move(x, y) {
    if (!active) return;
    const dx = x - start.x;
    const dy = y - start.y;
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, MAX);
    const nx = (dx / len) * (clamped / MAX);
    const ny = (dy / len) * (clamped / MAX);
    onChange(nx, ny);
  }
  function up() {
    if (!active) return;
    active = false; start = null;
    onChange(0, 0);
  }

  function te(e) {
    const t = e.touches[0];
    if (!t) return;
    const r = canvas.getBoundingClientRect();
    down(t.clientX - r.left, t.clientY - r.top);
    e.preventDefault();
  }
  function tm(e) {
    const t = e.touches[0];
    if (!t) return;
    const r = canvas.getBoundingClientRect();
    move(t.clientX - r.left, t.clientY - r.top);
    e.preventDefault();
  }
  function me(e) {
    const r = canvas.getBoundingClientRect();
    down(e.clientX - r.left, e.clientY - r.top);
  }
  function mm(e) {
    if (!active) return;
    const r = canvas.getBoundingClientRect();
    move(e.clientX - r.left, e.clientY - r.top);
  }

  canvas.addEventListener("touchstart", te, { passive: false });
  canvas.addEventListener("touchmove", tm, { passive: false });
  canvas.addEventListener("touchend", up);
  canvas.addEventListener("touchcancel", up);
  window.addEventListener("mousemove", mm);
  window.addEventListener("mouseup", up);
  canvas.addEventListener("mousedown", me);

  return () => {
    canvas.removeEventListener("touchstart", te);
    canvas.removeEventListener("touchmove", tm);
    canvas.removeEventListener("touchend", up);
    canvas.removeEventListener("touchcancel", up);
    window.removeEventListener("mousemove", mm);
    window.removeEventListener("mouseup", up);
    canvas.removeEventListener("mousedown", me);
  };
}
