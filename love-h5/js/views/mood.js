/* 每日心情 + 悄悄话：value = mood/{today} = {boy:{emoji,whisper,ts}, girl:{...}} */
import { Store } from "../core/store.js";
import { getRole, getPeer } from "../core/room.js";
import { todayStr, MOODS, roleFull, escapeHtml, toast } from "../core/utils.js";

let unsub = null, picked = null;

function showMine(m) {
  document.getElementById("myEmoji").textContent = m.emoji;
  document.getElementById("myLabel").textContent = (MOODS.find(x => x.emoji === m.emoji) || {}).label || "";
  document.getElementById("whisper").value = m.whisper || "";
  picked = m.emoji;
  document.querySelectorAll(".mood-emoji").forEach(n => n.classList.toggle("sel", n.dataset.e === m.emoji));
}
function renderPeer(p) {
  const el = document.getElementById("peerMood");
  if (!p || !p.emoji) { el.innerHTML = `<div class="muted small">ta 还没设置今日心情</div>`; return; }
  el.innerHTML = `
    <div class="peer-mood"><span class="pe-emoji">${p.emoji}</span><span class="pe-name">${roleFull(getPeer())} 的今日</span></div>
    ${p.whisper ? `<div style="margin-top:6px;line-height:1.55">${escapeHtml(p.whisper)}</div>` : `<div class="muted small">ta 没留悄悄话</div>`}`;
}

export function mount() {
  const el = document.getElementById("view-mood");
  const role = getRole();
  el.innerHTML = `
    <div class="mood-head">
      <div class="my-emoji" id="myEmoji">🙂</div>
      <div class="my-label" id="myLabel">点下面的表情选今日心情</div>
    </div>
    <div class="mood-grid" id="moodGrid">
      ${MOODS.map(m => `<div class="mood-emoji" data-e="${m.emoji}">${m.emoji}</div>`).join("")}
    </div>
    <div class="section-title">✍️ 一句悄悄话</div>
    <textarea id="whisper" class="textarea" placeholder="想对 ta 说..."></textarea>
    <button class="btn btn-primary btn-block mt16" id="moodSave">保存今日心情</button>
    <div class="section-title">💝 ta 的今日</div>
    <div id="peerMood" class="whisper-card"><div class="muted small">ta 还没设置今日心情</div></div>`;

  el.querySelectorAll(".mood-emoji").forEach(n => n.onclick = () => {
    el.querySelectorAll(".mood-emoji").forEach(x => x.classList.remove("sel"));
    n.classList.add("sel"); picked = n.dataset.e;
    document.getElementById("myEmoji").textContent = picked;
    document.getElementById("myLabel").textContent = (MOODS.find(m => m.emoji === picked) || {}).label || "";
  });
  document.getElementById("moodSave").onclick = async () => {
    if (!picked) { toast("先选个心情呀～"); return; }
    const w = document.getElementById("whisper").value.trim();
    await Store.update(`mood/${todayStr()}`, { [role]: { emoji: picked, whisper: w, ts: Store.now() } });
    toast("已保存 💕 ta 能看到啦");
  };
  unsub = Store.onValue(`mood/${todayStr()}`, data => {
    if (data && data[role]) showMine(data[role]);
    renderPeer(data && data[getPeer()]);
  });
}
export function unmount() { if (unsub) { unsub(); unsub = null; } }
