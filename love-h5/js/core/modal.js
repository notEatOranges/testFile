/* ============================================================
   通用模态弹框组件 —— modal.js
   - showConfirm(opts) → Promise<boolean>（true=点了确认，false=取消/点遮罩）
   - 自定义样式（不依赖原生 confirm/alert），主题变量驱动，带淡入与缩放动画。
   - 一次只显示一个；点遮罩或取消即关闭并 resolve(false)。
   ============================================================ */

import { escapeHtml } from "./utils.js";

/**
 * @param {object} opts
 *   title     标题（默认"提示"）
 *   message   正文（可选）
 *   okText    确认按钮文案（默认"确定"）
 *   cancelText 取消按钮文案（默认"取消"）
 *   danger    确认按钮是否为危险色（红），默认 false
 * @returns {Promise<boolean>}
 */
export function showConfirm({
  title = "提示",
  message = "",
  okText = "确定",
  cancelText = "取消",
  danger = false,
} = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true">
        <div class="modal-title">${escapeHtml(title)}</div>
        ${message ? `<div class="modal-msg">${escapeHtml(message)}</div>` : ""}
        <div class="modal-actions">
          <button class="btn btn-ghost modal-cancel">${escapeHtml(cancelText)}</button>
          <button class="btn ${danger ? "btn-danger" : "btn-primary"} modal-ok">${escapeHtml(okText)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    // 下一帧触发动画
    requestAnimationFrame(() => overlay.classList.add("show"));

    let done = false;
    const close = val => {
      if (done) return;
      done = true;
      overlay.classList.remove("show");
      setTimeout(() => overlay.remove(), 200);
      resolve(val);
    };
    overlay.querySelector(".modal-cancel").onclick = () => close(false);
    overlay.querySelector(".modal-ok").onclick = () => close(true);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(false); });  // 点遮罩=取消
  });
}
