/* 对话：实时聊天，男女头像各一张 */
import { Store } from "../core/store.js";
import { getRole } from "../core/room.js";
import { escapeHtml, fmtTime } from "../core/utils.js";

let unsub = null;

function avatar(sender) { return `./assets/images/${sender === "boy" ? "boy" : "girl"}.jpg`; }

function bubble(m, me) {
  const mine = m.sender === me;
  return `<div class="bubble-row ${mine ? "me" : "peer"}">
    <img class="avatar" src="${avatar(m.sender)}" alt="" />
    <div class="bubble">${escapeHtml(m.text)}<span class="bubble-time">${fmtTime(m.ts)}</span></div>
  </div>`;
}

export function mount() {
  const el = document.getElementById("view-chat");
  el.innerHTML = `
    <div class="chat-list" id="chatList"></div>
    <div class="chat-input-bar">
      <input id="chatInput" class="input flex1" placeholder="说点什么～" autocomplete="off" />
      <button id="chatSend" class="btn btn-primary">发送</button>
    </div>`;

  const list = document.getElementById("chatList");
  const input = document.getElementById("chatInput");

  const send = async () => {
    const t = input.value.trim();
    if (!t) return;
    input.value = "";
    await Store.push("chat", { sender: getRole(), text: t, ts: Store.now() });
  };
  document.getElementById("chatSend").onclick = send;
  input.addEventListener("keydown", e => { if (e.key === "Enter") send(); });

  unsub = Store.onList("chat", items => {
    list.innerHTML = items.map(m => bubble(m, getRole())).join("") ||
      `<div class="empty">还没有消息，先和 ta 说句话吧 💕</div>`;
    list.scrollTop = list.scrollHeight;
  });
}

export function unmount() { if (unsub) { unsub(); unsub = null; } }
