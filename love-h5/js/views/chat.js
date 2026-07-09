/* 对话：微信风格实时聊天。
 *  - 乐观回显：发送即上屏（⏳），push 成功就去掉 ⏳（不依赖 realtime）。
 *  - 时间分隔：首条 + 与上一条间隔 >5 分钟时，中间插一个时间胶囊。
 *  - 纯 emoji 消息以大字显示（无气泡背景），像微信表情。
 *  - 表情面板：输入栏 😊 切换，点表情插入到输入框光标处。
 *  男女头像各一张。 */
import { Store } from "../core/store.js";
import { getRole } from "../core/room.js";
import { escapeHtml, fmtTime } from "../core/utils.js";

let unsub = null;
let lastItems = [];
const pending = [];        // {sender,text,ts,status:'sending'|'sent'|'failed'}

const EMOJIS = [
  "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","🥰","😘","😋",
  "🤗","🤔","😐","😏","😶","🙄","😣","😥","😮","🤐","😯","😪","😫","😴","😌","😛",
  "😜","🤪","😝","🤤","😒","😓","😔","😕","🙃","🫠","😞","😖","😞","😟","😤","😢",
  "😭","😦","😧","😨","😩","🤯","😬","😰","😱","😳","🤗","🤩","🥳","🤠","😇","🥺",
  "🤒","🤕","🤧","😷","🥵","🥶","🤴","👸","🤵","👰","🤰","💑","💏","👪","🫶","💖",
  "👋","🤚","✋","🖖","👌","✌️","🤞","🤟","🤙","👈","👉","👆","👇","✊","👊","🙏",
  "💪","👏","🙌","🤝","👀","🧠","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔",
  "❣️","💕","💞","💓","💗","💖","💘","💝","💌","🔥","✨","🌟","⭐","🌈","☀️","🌙",
  "🍉","🍓","🍒","🍑","🍰","🎂","🍬","🍭","🍫","🍩","🐱","🐶","🐰","🐻","🐼","🐨",
];

function avatar(sender) { return `./assets/images/${sender === "boy" ? "boy" : "girl"}.jpg`; }

/** 是否纯 emoji（用于大字表情渲染） */
function isEmojiOnly(t) {
  if (!t || t.length > 6) return false;
  // 去掉 emoji variation selector / zero-width joiner 后，剩余应全为 emoji
  const stripped = t.replace(/[️‍♀♂]/g, "");
  return /^(\p{Extended_Pictographic})+$/u.test(stripped);
}

/** 微信式时间：今天 HH:mm；昨天 昨天 HH:mm；本年 M月D日 HH:mm；更早 YYYY/M/D HH:mm */
function formatChatTime(ts) {
  const d = new Date(ts), now = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `${hh}:${mm}`;
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `昨天 ${hh}:${mm}`;
  if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

function bubble(m, me, status) {
  const mine = m.sender === me;
  const emoji = isEmojiOnly(m.text);
  const badge = status === "sending" ? `<span class="bubble-status" title="发送中">⏳</span>`
             : status === "failed"  ? `<span class="bubble-status failed" title="发送失败">❗</span>` : "";
  const inner = emoji
    ? escapeHtml(m.text)
    : `${escapeHtml(m.text)}<span class="bubble-time">${fmtTime(m.ts)}</span>${badge}`;
  return `<div class="bubble-row ${mine ? "me" : "peer"}${emoji ? " emoji-only" : ""}">
    <img class="avatar" src="${avatar(m.sender)}" alt="" />
    <div class="bubble">${inner}</div>
  </div>`;
}

function render(list) {
  const me = getRole();
  const serverTs = new Set(lastItems.map(m => m.ts));
  const opt = pending.filter(p => !serverTs.has(p.ts));
  const statusOf = ts => { const p = opt.find(x => x.ts === ts); return p ? p.status : "sent"; };
  const all = [...lastItems, ...opt].sort((a, b) => (a.ts || 0) - (b.ts || 0));

  let html = "";
  let prevTs = 0;
  for (const m of all) {
    if (!prevTs || (m.ts - prevTs) > 5 * 60 * 1000) {
      html += `<div class="chat-time">${formatChatTime(m.ts)}</div>`;
    }
    prevTs = m.ts;
    html += bubble(m, me, statusOf(m.ts));
  }
  list.innerHTML = html || `<div class="empty">还没有消息，先和 ta 说句话吧 💕</div>`;
  list.scrollTop = list.scrollHeight;
}

export function mount() {
  const el = document.getElementById("view-chat");
  el.innerHTML = `
    <div class="chat-list" id="chatList"></div>
    <div class="chat-emoji" id="chatEmoji" style="display:none">
      ${EMOJIS.map(e => `<span class="emoji-cell">${e}</span>`).join("")}
    </div>
    <div class="chat-input-bar">
      <button class="icon-btn chat-emoji-btn" id="chatEmojiBtn" aria-label="表情"><i class="ri-emotion-happy-line"></i></button>
      <input id="chatInput" class="input flex1" placeholder="说点什么～" autocomplete="off" />
      <button id="chatSend" class="btn btn-primary">发送</button>
    </div>`;

  const list = document.getElementById("chatList");
  const input = document.getElementById("chatInput");
  const emojiPanel = document.getElementById("chatEmoji");

  // 表情面板：切换 + 点选插入到输入框光标处
  document.getElementById("chatEmojiBtn").onclick = e => {
    e.stopPropagation();
    emojiPanel.style.display = emojiPanel.style.display === "none" ? "" : "none";
  };
  emojiPanel.addEventListener("click", e => {
    const cell = e.target.closest(".emoji-cell");
    if (!cell) return;
    const s = cell.textContent;
    const i = input.selectionStart ?? input.value.length;
    input.value = input.value.slice(0, i) + s + input.value.slice(input.selectionEnd ?? i);
    const pos = i + s.length;
    input.focus(); input.setSelectionRange(pos, pos);
  });
  // 点输入框收起表情面板
  input.addEventListener("focus", () => { emojiPanel.style.display = "none"; });

  const send = async () => {
    const t = input.value.trim();
    if (!t) return;
    input.value = "";
    const entry = { sender: getRole(), text: t, ts: Store.now(), status: "sending" };
    pending.push(entry);
    render(list);
    try {
      await Store.push("chat", { sender: entry.sender, text: entry.text, ts: entry.ts });
      entry.status = "sent";
      render(list);
    } catch (e) {
      entry.status = "failed";
      render(list);
    }
  };
  document.getElementById("chatSend").onclick = send;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") { emojiPanel.style.display = "none"; send(); }
  });

  unsub = Store.onList("chat", items => { lastItems = items || []; render(list); });
  render(list);
}

export function unmount() {
  if (unsub) { unsub(); unsub = null; }
  lastItems = [];
  pending.length = 0;
}
