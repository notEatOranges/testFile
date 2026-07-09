/* 共同心愿清单：wishlist={id:{text,done,createdBy,completedBy,ts,doneTs}} */
import { Store } from "../core/store.js";
import { getRole } from "../core/room.js";
import { escapeHtml, toast } from "../core/utils.js";

let unsub = null;

export function mount() {
  const el = document.getElementById("view-wishlist");
  el.innerHTML = `
    <div id="wishList"></div>
    <div class="wish-add card">
      <input id="wishInput" class="input flex1" placeholder="想一起做的事..." />
      <button id="wishAdd" class="btn btn-primary">加</button>
    </div>`;

  const add = async () => {
    const inp = document.getElementById("wishInput");
    const t = inp.value.trim();
    if (!t) return;
    inp.value = "";
    await Store.push("wishlist", { text: t, done: false, createdBy: getRole(), completedBy: null, ts: Store.now(), doneTs: null });
  };
  document.getElementById("wishAdd").onclick = add;
  document.getElementById("wishInput").addEventListener("keydown", e => { if (e.key === "Enter") add(); });

  unsub = Store.onList("wishlist", items => renderList(items));
}

function renderList(items) {
  const el = document.getElementById("wishList");
  if (!items.length) { el.innerHTML = `<div class="empty">还没有心愿，加一个想一起做的事吧 ✨</div>`; return; }
  el.innerHTML = items.map(it => `
    <div class="wish-item ${it.done ? "done" : ""}" data-id="${it.id}">
      <div class="check" data-act="toggle">${it.done ? "✓" : ""}</div>
      <div class="wt">${escapeHtml(it.text)}</div>
      <div class="del" data-act="del">×</div>
    </div>`).join("");
  el.querySelectorAll(".wish-item").forEach(row => {
    const id = row.dataset.id;
    const it = items.find(x => x.id === id);
    row.querySelector('[data-act=toggle]').onclick = async () => {
      const willDone = !it.done;
      await Store.update("wishlist", { [id]: { ...it, done: willDone, completedBy: willDone ? getRole() : null, doneTs: willDone ? Store.now() : null } });
      if (willDone) toast("完成一件啦 🎉");
    };
    row.querySelector('[data-act=del]').onclick = async () => {
      await Store.transaction("wishlist", cur => { if (cur && cur[id]) delete cur[id]; return cur; });
    };
  });
}

export function unmount() { if (unsub) { unsub(); unsub = null; } }
