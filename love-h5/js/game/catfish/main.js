/* ============================================================
   主入口编排 —— main.js
   负责：初始化主题/Store/engine/sync、选模式 UI、双方 ready 协调、
        监听 status 推进结算、再来一局、回首页。

   catfish.html 是独立页（被主站 router iframe 加载），所以这里要自己
   init Store + 判定房间身份（localStorage 已存 lh5_room/lh5_role）。
   若没 enter 过房间（直接打开 catfish.html），引导回 index.html。
   ============================================================ */

import { Store } from "../../core/store.js";
import * as room from "../../core/room.js";
import { getTheme } from "../../core/theme.js";
import { MODE_LIST, getMode } from "./modes.js";
import * as engine from "./engine.js";
import {
  ensureGame, joinGame, setStatus, setConfig, setTurn,
  leaveGame, gamePath,
} from "./sync.js";

const $ = id => document.getElementById(id);
const myRole = room.getRole();
const peer = room.getPeer();

let chosenMode = null;
let gameStarted = false;
let shownResult = false;
let unsubPeer = null;
let unsubGame = null;
let unsubReady = null;

if (!myRole) location.replace("../index.html");

function toast(msg, ms = 1800) {
  const t = document.createElement("div");
  t.className = "cf-toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; }, ms - 300);
  setTimeout(() => t.remove(), ms);
}

/* —— 主题切换器 —— */
function initThemeSwitcher() {
  const fab = $("cfFab"), pop = $("cfPop");
  fab.addEventListener("click", e => { e.stopPropagation(); pop.classList.toggle("show"); });
  document.addEventListener("click", () => pop.classList.remove("show"));
  pop.addEventListener("click", e => e.stopPropagation());
  pop.querySelectorAll(".cf-opt").forEach(el => el.addEventListener("click", () => {
    localStorage.setItem("lh5-theme", el.dataset.theme);
    document.documentElement.setAttribute("data-theme", el.dataset.theme);
    pop.classList.remove("show");
    setTimeout(() => location.reload(), 60);
  }));
  const cur = getTheme();
  pop.querySelectorAll(".cf-opt").forEach(el => el.classList.toggle("active", el.dataset.theme === cur));
}

/* —— 选模式 UI —— */
function renderModes() {
  const box = $("cfModal").querySelector(".cf-modes");
  box.innerHTML = MODE_LIST.map(m => `
    <div class="cf-mode" data-mode="${m.id}">
      <div class="cf-mode-ic">${m.ic}</div>
      <div class="cf-mode-n">${m.n}</div>
      <div class="cf-mode-d">${m.d}</div>
    </div>`).join("");
  box.querySelectorAll(".cf-mode").forEach(el => el.addEventListener("click", () => {
    box.querySelectorAll(".cf-mode").forEach(x => x.classList.remove("sel"));
    el.classList.add("sel");
    chosenMode = el.dataset.mode;
    $("cfWait").textContent = "已选「" + (MODE_LIST.find(m => m.id === chosenMode) || {}).n + "」，等对方就绪…";
    // 把自己选择写进 player，对方订阅能看到
    Store.update(gamePath(`players/${myRole}`), { mode: chosenMode, ready: true });
    tryAutoStart();
  }));
}

/* 尝试开局：双方都 ready + same mode → 推进 playing */
function tryAutoStart() {
  if (gameStarted) return;
  // 对方已订阅时会回调；这里不做额外读
}

/* ==================== 主流程: init → ensureGame → join → engine → 订阅对方模式 ready ==================== */
async function startFlow() {
  await Store.init();
  if (room.isSetup()) await room.enter(room.getRoom(), room.getRole());

  await ensureGame();
  await joinGame(null);
  await engine.init(document.getElementById("cfCanvas"));

  // ★ 监听对方 player：只要看到 mode === 我选的，且双方 ready → 开局
  handleReadyAndGame();
}

async function handleReadyAndGame() {
  // 对方 player 变化
  unsubPeer = Store.onValue(gamePath(`players/${peer}`), async p => {
    if (!p || gameStarted) return;
    if (p.ready && p.mode && chosenMode && p.mode === chosenMode) {
      gameStarted = true;
      $("cfModal").style.display = "none";
      const cfg = getMode(chosenMode);
      await setConfig({ mode: chosenMode, duration: cfg.duration, targetFish: cfg.targetFish, maxTurns: cfg.maxTurns });
      await setTurn({ current: "boy", switchedAt: Store.now() });
      await setStatus("playing");
      await engine.startGame(chosenMode);
      toast("开始！🐱🐟");
    }
  });

  // 或对方先选了（自己选了后对方也选）：已有的远端值也可能满足条件
  // onValue 初始化会立即读一次（本地模式同步、云端异步），无需额外检测

  // 监听 game status → 结算
  unsubGame = Store.onValue(gamePath(), async g => {
    if (!g) return;
    if (g.status === "playing" && !gameStarted) {
      // 对方推进了 playing（己方被带动）
      gameStarted = true;
      $("cfModal").style.display = "none";
      const m = (g.mode) || chosenMode || "versus";
      if (!chosenMode) chosenMode = m;
      await engine.startGame(chosenMode);
      toast("开始！🐱🐟");
    }
    if (g.status === "ended" && !shownResult) {
      shownResult = true;
      showResult();
    }
  });
}

/* —— 结算 —— */
function showResult() {
  const st = engine.getState();
  const mc = getMode(st.mode || "versus");
  const winner = mc.winner({ scores: st.scores, mode: st.mode });
  const title =
    winner === "draw" ? "平局 🤝" :
    winner === "shared" ? "合作成功 🎉" :
    winner === "fail" ? "差一点 💪" :
    winner === myRole ? "你赢啦 🎉" : `${{ boy: "男生", girl: "女生" }[peer]}赢`;
  $("cfResultTitle").textContent = title;
  $("cfResultBody").innerHTML = `
    <div class="cf-result-row">模式：${mc.name}</div>
    <div class="cf-result-row">${mc.summary({ scores: st.scores })}</div>
    <div class="cf-result-row" style="font-size:12px;color:var(--text-soft)">
      ${st.scores.boy || 0} vs ${st.scores.girl || 0}
      ${st.mode === "coop" ? " · 合作目标 " + (mc.targetFish || "15") + "" : ""}</div>`;
  $("cfResult").style.display = "flex";
}

/* —— 再来一局 —— */
async function playAgain() {
  gameStarted = false; shownResult = false;
  $("cfResult").style.display = "none";
  await Store.update(gamePath("scores"), { boy: 0, girl: 0, shared: 0 });
  await Store.update(gamePath("fish"), null);
  await Store.update(gamePath("turn"), null);
  chosenMode = null;
  $("cfModal").style.display = "flex";
  $("cfWait").textContent = "选择模式后等待对方加入…";
  document.querySelectorAll(".cf-mode").forEach(x => x.classList.remove("sel"));
  engine.resetForReplay();
}

/* —— 回首页 —— */
async function goHome() {
  if (unsubPeer) { unsubPeer(); unsubPeer = null; }
  if (unsubGame) { unsubGame(); unsubGame = null; }
  await leaveGame();
  engine.destroy();
  if (window.parent && window.parent.location !== window.location) {
    window.parent.postMessage({ type: "cf-go-home" }, "*");
  } else {
    location.replace("../index.html");
  }
}

/* —— 启动 —— */
async function boot() {
  initThemeSwitcher();
  $("cfBack").onclick = goHome;
  $("cfCancel").onclick = goHome;
  $("cfHome").onclick = goHome;
  $("cfAgain").onclick = playAgain;
  document.addEventListener("keydown", e => { if (e.key === "Escape") goHome(); });
  renderModes();
  await startFlow();
}

boot();