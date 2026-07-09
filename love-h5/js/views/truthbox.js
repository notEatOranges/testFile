/* 真心话盲盒：truthbox/q={question,pickedBy,pickedTs}; truthbox/answer/{role}={text,ts} */
import { Store } from "../core/store.js";
import { getRole, getPeer } from "../core/room.js";
import { TRUTH_QUESTIONS, roleFull, escapeHtml, fmtDateTime, toast } from "../core/utils.js";

let uq = null, ua = null, ub = null;
const pickQ = () => TRUTH_QUESTIONS[Math.floor(Math.random() * TRUTH_QUESTIONS.length)];
const avatar = r => `./assets/images/${r === "boy" ? "boy" : "girl"}.jpg`;

export function mount() {
  const role = getRole();
  const el = document.getElementById("view-truthbox");
  el.innerHTML = `
    <div id="truthQ"></div>
    <button class="btn btn-ghost btn-block mt16" id="newQ">🎲 换一题</button>
    <div class="section-title">✍️ 我的回答</div>
    <textarea id="myAns" class="textarea" placeholder="认真回答哦～"></textarea>
    <button class="btn btn-primary btn-block mt8" id="saveAns">提交回答</button>
    <div class="section-title">👀 ta 的回答</div>
    <div id="peerAns"></div>`;

  uq = Store.onValue("truthbox/q", q => {
    const e = document.getElementById("truthQ");
    if (!q) { e.innerHTML = `<div class="truth-q"><div class="q-label">真心话</div><div class="q-text">点下面抽一题吧 🔥</div></div>`; return; }
    e.innerHTML = `<div class="truth-q"><div class="q-label"><img class="q-av" src="./assets/images/${q.pickedBy}.jpg" alt=""/>真心话 · ${roleFull(q.pickedBy)} 抽的</div><div class="q-text">${escapeHtml(q.question)}</div></div>`;
  });
  ua = Store.onValue(`truthbox/answer/${role}`, a => { if (a) document.getElementById("myAns").value = a.text; });
  ub = Store.onValue(`truthbox/answer/${getPeer()}`, a => {
    const e = document.getElementById("peerAns");
    if (!a || !a.text) { e.innerHTML = `<div class="empty">ta 还没回答</div>`; return; }
    e.innerHTML = `<div class="truth-answer"><div class="who"><img src="${avatar(getPeer())}" alt=""/>${roleFull(getPeer())} · ${fmtDateTime(a.ts)}</div><div>${escapeHtml(a.text)}</div></div>`;
  });

  document.getElementById("newQ").onclick = async () => {
    const q = pickQ();
    await Store.set("truthbox/q", { question: q, pickedBy: role, pickedTs: Store.now() });
    await Store.set("truthbox/answer/boy", null);
    await Store.set("truthbox/answer/girl", null);
    document.getElementById("myAns").value = "";
    toast("新题已抽 🔥");
  };
  document.getElementById("saveAns").onclick = async () => {
    const t = document.getElementById("myAns").value.trim();
    if (!t) { toast("写点什么～"); return; }
    await Store.update(`truthbox/answer/${role}`, { text: t, ts: Store.now() });
    toast("已提交 💕");
  };
}

export function unmount() { uq && uq(); ua && ua(); ub && ub(); uq = ua = ub = null; }
