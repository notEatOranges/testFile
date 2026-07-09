/* 共同心愿清单：wishlist={id:{text,done,createdBy,completedBy,ts,doneTs}}
 *  - 添加/完成/删除：全部走 withLoading（loading+禁用，即点击节流，防重复提交）
 *  - 完成 & 删除：二次确认弹框（showConfirm）
 *  - 写入后由 store 的 sbEmit 立即刷新本端列表（不依赖 realtime） */
import { Store } from "../core/store.js";
import { getRole } from "../core/room.js";
import { escapeHtml, toast, withLoading } from "../core/utils.js";
import { showConfirm } from "../core/modal.js";

let unsub = null;

export function mount() {
  const el = document.getElementById("view-wishlist");
  el.innerHTML = `
    <div id="wishList" class="wish-list"></div>
    <div class="wish-add">
      <input id="wishInput" class="input" placeholder="想一起做的事..." autocomplete="off" />
      <button id="wishAdd" class="btn btn-primary wish-add-btn" aria-label="添加">添加</button>
    </div>`;

  const doAdd = async () => {
    const inp = document.getElementById("wishInput");
    const t = inp.value.trim();
    if (!t) return;
    inp.value = "";
    await Store.push("wishlist", { text: t, done: false, createdBy: getRole(), completedBy: null, ts: Store.now(), doneTs: null });
    toast("已添加 ✨");
  };
  const addBtn = document.getElementById("wishAdd");
  addBtn.onclick = function () { withLoading(this, doAdd, ""); };
  document.getElementById("wishInput").addEventListener("keydown", e => {
    if (e.key === "Enter") withLoading(addBtn, doAdd, "");
  });

  unsub = Store.onList("wishlist", items => renderList(items));
}

function renderList(items) {
  const el = document.getElementById("wishList");
  if (!items.length) { el.innerHTML = `<div class="empty">还没有心愿，加一个想一起做的事吧 ✨</div>`; return; }
  el.innerHTML = items.map(it => `
    <div class="wish-item ${it.done ? "done" : ""}" data-id="${it.id}">
      <button class="check" data-act="toggle" aria-label="切换完成">${it.done ? '<i class="ri-check-line"></i>' : ""}</button>
      <div class="wt">${escapeHtml(it.text)}</div>
      <button class="del" data-act="del" aria-label="删除"><i class="ri-close-line"></i></button>
    </div>`).join("");

  el.querySelectorAll(".wish-item").forEach(row => {
    const id = row.dataset.id;
    const it = items.find(x => x.id === id);
    row.querySelector('[data-act=toggle]').onclick = async function () {
      const willDone = !it.done;
      if (willDone) {
        const ok = await showConfirm({ title: "完成心愿", message: `确定完成「${it.text}」吗？`, okText: "完成", cancelText: "取消" });
        if (!ok) return;
      }
      await withLoading(this, () => Store.update("wishlist", {
        [id]: { ...it, done: willDone, completedBy: willDone ? getRole() : null, doneTs: willDone ? Store.now() : null },
      }), "");
      if (willDone) toast("完成一件啦 🎉");
    };
    row.querySelector('[data-act=del]').onclick = async function () {
      const ok = await showConfirm({ title: "删除心愿", message: `确定删除「${it.text}」吗？`, okText: "删除", cancelText: "取消", danger: true });
      if (!ok) return;
      await withLoading(this, () => Store.transaction("wishlist", cur => { if (cur && cur[id]) delete cur[id]; return cur; }), "");
      toast("已删除");
    };
  });
}

export function unmount() { if (unsub) { unsub(); unsub = null; } }
