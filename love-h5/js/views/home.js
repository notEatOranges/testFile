/* 首页：欢迎 + 房间/身份 + 对方在线 + 功能导航卡片 */
import { Store } from "../core/store.js";
import { getRoom, getRole, getPeer, onPeerPresence, isOnline } from "../core/room.js";
import { go } from "../core/router.js";
import { roleFull } from "../core/utils.js";

let unsub = null;

const CARDS = [
  { go: "chat", ic: "💬", nt: "悄悄对话", nd: "只属于你俩", span: false },
  { go: "mood", ic: "💗", nt: "今日心情", nd: "emoji+悄悄话", span: false },
  { go: "days", ic: "📅", nt: "在一起", nd: "天数·纪念日", span: false },
  { go: "wishlist", ic: "✅", nt: "心愿清单", nd: "一起打卡", span: false },
  { go: "truthbox", ic: "🎲", nt: "真心话", nd: "随机抽题", span: false },
  { go: "catfish", ic: "🐱", nt: "猫猫吃鱼", nd: "双人联机", span: false },
  { go: "heart", ic: "💝", nt: "3D 爱心", nd: "My Heart Is Yours", span: true },
];

export function mount() {
  const el = document.getElementById("view-home");
  const role = getRole();
  const connected = Store.mode === "supabase";
  el.innerHTML = `
    <div class="home-head">
      <div class="hi"><img class="hi-av" src="./assets/images/${role}.jpg" alt=""/>嗨，${roleFull(role)} 👋</div>
      <span class="room-tag">${connected ? "☁️" : "🔌"} ${connected ? "已连接" : "本地预览"} · 房间 ${getRoom()}</span>
      <div class="presence"><span class="dot" id="peerDot"></span><img class="peer-av" src="./assets/images/${getPeer()}.jpg" alt=""/><span id="peerStatus">${roleFull(getPeer())}状态…</span></div>
    </div>
    <div class="grid-cards">
      ${CARDS.map(c => `
        <div class="nav-card${c.span ? " span2" : ""}" data-go="${c.go}">
          <span class="ic">${c.ic}</span>
          <div class="nt">${c.nt}</div>
          <div class="nd">${c.nd}</div>
        </div>`).join("")}
    </div>`;
  el.querySelectorAll("[data-go]").forEach(c => c.onclick = () => go(c.dataset.go));
  unsub = onPeerPresence(p => {
    const on = isOnline(p);
    document.getElementById("peerDot").classList.toggle("on", on);
    document.getElementById("peerStatus").textContent = `${roleFull(getPeer())}${on ? "在线 ♥" : "不在线"}`;
  });
}

export function unmount() { if (unsub) { unsub(); unsub = null; } }
