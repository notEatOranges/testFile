/* ============================================================
   游戏引擎 —— engine.js
   Canvas2D 渲染 + requestAnimationFrame 主循环 + 状态机 + 碰撞
   + 对方位置 lerp 插值 + 主题取色（从 CSS 变量读）

   状态机：waiting(选/等模式) → playing → ended
   引擎自身不决定模式选择（main.js 管 UI），只接收 run/start 推进。

   坐标系：内部一律用归一化 (0~1,0~1)，渲染时乘画布尺寸。
   这样联机广播的位置与分辨率无关，对方值可直接插值。
   ============================================================ */

import { bindInput } from "./input.js";
import { getMode } from "./modes.js";
import { themeColor } from "../../core/theme.js";

import {
  subscribeRemote, broadcastPos, sendPosNow,
  setStatus, setConfig, setTurn, bumpTurnSwitches,
  spawnFish, claimFish, removeFish, addScore, gamePath,
} from "./sync.js";
import { Store } from "../../core/store.js";
import { getRole, getPeer } from "../../core/room.js";

const myRole = getRole();
const peer = getPeer();

let canvas, ctx, W, H;
let raf = null;
let lastTs = 0;
let unbindInput = null;
let unsubState = null;

// 游戏运行时状态（引擎持有，本地权威；联机只同步必要项）
const game = {
  mode: "versus",
  status: "waiting",       // waiting / playing / ended
  cfg: null,                // 模式配置（from modes）
  scores: { boy: 0, girl: 0, shared: 0 },
  fish: {},                 // {id:{x,y,vx,vy,r,scored,eaten}}  本地缓存
  players: {                // 本地权威=自己；对方=插值后的远端
    boy: { x: 0.3, y: 0.5, rx: 0.3, ry: 0.5 },   // rx/ry=远端真实值
    girl: { x: 0.7, y: 0.5, rx: 0.7, ry: 0.5 },
  },
  turn: { current: "boy", switchedAt: 0 },
  turnSwitches: 0,
  eatenThisTurn: 0,
  dir: { x: 0, y: 0 },      // 输入方向（自己）
  now: 0,
  elapsed: 0,
  bg: null,                  // 主题色快照
};

const CAT_R = 0.07;   // 猫半径（归一化）
const FISH_R = 0.10;   // 鱼半径
const CAT_SPEED = 0.55; // 归一化/秒
const FISH_COUNT = 6;

/* ====================== 取色 ====================== */
function snapTheme() {
  game.bg = {
    bg1: themeColor("--bg-1") || "#fff5f7",
    bg2: themeColor("--bg-2") || "#ffe4ec",
    primary: themeColor("--primary") || "#ff7aa2",
    primaryDeep: themeColor("--primary-deep") || "#e85a86",
    accent: themeColor("--accent") || "#ff9eb5",
    text: themeColor("--text") || "#5a3d4a",
    card: themeColor("--card") || "#fff",
  };
  boyColor = game.bg.primaryDeep;
  girlColor = game.bg.accent;
}
let boyColor, girlColor;

/* ====================== 渲染 ====================== */
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.clientWidth; H = canvas.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawBg(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, game.bg.bg1);
  g.addColorStop(1, game.bg.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 气泡装饰（随时间上浮）
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 8; i++) {
    const bx = (i * 137.5 % W);
    const by = (H - ((t / 30 + i * 80) % (H + 60)));
    ctx.beginPath();
    ctx.arc(bx, by, 6 + (i % 3) * 3, 0, Math.PI * 2);
    ctx.fillStyle = game.bg.accent;
    ctx.fill();
  }
  ctx.restore();
}

function drawCat(role, p) {
  const cx = p.x * W, cy = p.y * H, r = CAT_R * Math.min(W, H);
  const mine = role === myRole;
  // 影子
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.8, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();
  // 身体（圆形 + 头像感）
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = role === "boy" ? boyColor : girlColor;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = mine ? game.bg.primaryDeep : "rgba(255,255,255,0.85)";
  ctx.stroke();
  // emoji 脸
  ctx.font = `${Math.floor(r * 1.4)}px serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(role === "boy" ? "🐱" : "😺", cx, cy + r * 0.05);
}

function drawFish(id, f) {
  if (f.eaten || f.claimedBy) return;
  const cx = f.x * W, cy = f.y * H, r = FISH_R * Math.min(W, H);
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.font = `${Math.floor(r * 1.5)}px serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🐟", cx, cy);
  ctx.restore();
}

function Hud_overlay(center) {
  const el = document.getElementById("cfCenter");
  if (el) el.textContent = center;
  if (game.mode === "coop") {
    document.getElementById("cfScoreBoy").textContent = game.scores.shared || 0;
    document.getElementById("cfScoreGirl").textContent = game.scores.shared || 0;
  } else {
    document.getElementById("cfScoreBoy").textContent = game.scores.boy || 0;
    document.getElementById("cfScoreGirl").textContent = game.scores.girl || 0;
  }
}

/* ====================== 鱼生成与运动 ====================== */
function randomFishPos() {
  return {
    x: 0.15 + Math.random() * 0.7,
    y: 0.18 + Math.random() * 0.7,
    vx: (Math.random() - 0.5) * 0.12,
    vy: (Math.random() - 0.5) * 0.12,
  };
}

let lastSpawn = 0;
async function maintainFish(dt) {
  const alive = Object.keys(game.fish).length;
  if (alive < FISH_COUNT && (game.now - lastSpawn) > 1500) {
    lastSpawn = game.now;
    const p = randomFishPos();
    await spawnFish({ x: p.x, y: p.y, vx: p.vx, vy: p.vy });
  }
  // 本地更新鱼位置（鱼是共享态，但视觉每一端都模拟漂移更顺滑；
  // 关键：吃鱼用 claim 原子，位置漂移仅视觉，不影响记分正确性）
  for (const id in game.fish) {
    const f = game.fish[id];
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    if (f.x < 0.08 || f.x > 0.92) f.vx *= -1, f.x = Math.min(0.92, Math.max(0.08, f.x));
    if (f.y < 0.1 || f.y > 0.9) f.vy *= -1, f.y = Math.min(0.9, Math.max(0.1, f.y));
  }
}

/* ====================== 碰撞 + 抢鱼 ====================== */
async function tryEat() {
  const me = game.players[myRole];
  if (!me) return;
  for (const id in game.fish) {
    const f = game.fish[id];
    if (f.eaten || f.claimedBy) continue;
    if (!getMode(game.mode).canMove(game, myRole)) return;  // 回合制非己回合不动
    const dx = me.x - f.x, dy = me.y - f.y;
    if (Math.hypot(dx, dy) < (CAT_R + FISH_R) * 0.8) {
      f.eaten = true;   // 先本地静默避免重复尝试
      const got = await claimFish(id);
      if (got === myRole) {
        // 加分
        const cfg = getMode(game.mode);
        const scorePath = game.mode === "coop" ? "shared" : myRole;
        await addScore(scorePath);
        game.scores[scorePath] = (game.scores[scorePath] || 0) + 1;
        game.eatenThisTurn++;
        // 移除鱼
        await removeFish(id);
        delete game.fish[id];
      } else {
        f.eaten = false;  // 被对方先抢了，留作对方吃
      }
    }
  }
}

/* ====================== 主循环 ====================== */
function frame(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  game.now = ts;

  if (game.status === "playing") {
    game.elapsed += dt;

    // 自己移动
    const me = game.players[myRole];
    if (me && getMode(game.mode).canMove(game, myRole)) {
      me.x += game.dir.x * CAT_SPEED * dt;
      me.y += game.dir.y * CAT_SPEED * dt;
      me.x = Math.min(0.95, Math.max(0.05, me.x));
      me.y = Math.min(0.95, Math.max(0.05, me.y));
    }
    // 对方位置 lerp 到远端真实值
    const op = game.players[peer];
    if (op) {
      op.x += (op.rx - op.x) * Math.min(1, dt * 8);
      op.y += (op.ry - op.y) * Math.min(1, dt * 8);
    }
    // 广播自己位置（节流由 sync 内部 throttle）
    if (me) broadcastPos(me.x, me.y);

    maintainFish(dt);    // 鱼维持（async，不 await）
    tryEat();            // 抢鱼检测（async）

    // 回合制换人
    if (game.mode === "turn" && game.cfg) {
      if (getMode("turn").tickTurn(game, game.eatenThisTurn)) {
        const next = game.turn.current === "boy" ? "girl" : "boy";
        game.eatenThisTurn = 0;
        game.turn = { current: next, switchedAt: ts };
        setTurn({ current: next, switchedAt: ts });
        bumpTurnSwitches();
      }
    }

    // 结束判定
    if (getMode(game.mode).shouldEnd(game)) {
      endGame();
    }

    // HUD 倒计时
    const cfg = game.cfg;
    const center = hudCenterText();
    Hud_overlay(center);
  }

  // 渲染
  ctx.clearRect(0, 0, W, H);
  drawBg(ts);
  for (const id in game.fish) drawFish(id, game.fish[id]);
  drawCat("boy", game.players.boy);
  drawCat("girl", game.players.girl);

  if (game.status === "playing") raf = requestAnimationFrame(frame);
  else raf = requestAnimationFrame(frame);  // 即使 waiting/ended 也持续渲染背景与对方位置
}

function hudCenterText() {
  const cfg = game.cfg;
  if (!cfg) return "准备中…";
  if (game.mode === "versus") {
    return `⏱ ${Math.max(0, Math.ceil(cfg.duration - game.elapsed))}s`;
  }
  if (game.mode === "coop") {
    return `${game.scores.shared || 0}/${cfg.targetFish}`;
  }
  if (game.mode === "turn") {
    const left = cfg.maxTurns - (game.turnSwitches || 0);
    return `${game.turn.current === myRole ? "你的" : "对方"}回合 · 余${left}`;
  }
  return "";
}

/* ====================== 状态机 ====================== */
export async function startGame(mode) {
  game.mode = mode;
  game.cfg = getMode(mode);
  game.scores = { boy: 0, girl: 0, shared: 0 };
  game.eatenThisTurn = 0;
  game.turnSwitches = 0;
  game.turn = { current: "boy", switchedAt: game.now };
  game.elapsed = 0;
  game.fish = {};
  game.status = "playing";
  // 房主写 config + turn 帮助对方同步
  await setConfig({ mode, duration: game.cfg.duration, targetFish: game.cfg.targetFish, maxTurns: game.cfg.maxTurns });
  await setTurn({ current: "boy", switchedAt: game.now });
  await setStatus("playing");
  // 预生成几条鱼
  for (let i = 0; i < 4; i++) {
    const p = randomFishPos();
    await spawnFish({ x: p.x, y: p.y, vx: p.vx, vy: p.vy });
  }
}

export function endGame() {
  if (game.status === "ended") return;
  game.status = "ended";
  setStatus("ended");
  // main.js 监听 status 会显示结算
}

export function resetForReplay() {
  game.scores = { boy: 0, girl: 0, shared: 0 };
  game.eatenThisTurn = 0;
  game.turnSwitches = 0;
  game.elapsed = 0;
  game.fish = {};
}

/* ====================== 引擎入口 ====================== */
export async function init(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext("2d");
  snapTheme();
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  // 输入
  unbindInput = bindInput(canvas, (dx, dy) => {
    game.dir.x = dx; game.dir.y = dy;
  });

  // 订阅远端
  subscribeRemote({
    onPeer: p => {
      if (!p) { game.players[peer] = null; return; }
      if (!game.players[peer]) game.players[peer] = { x: p.x, y: p.y, rx: p.x, ry: p.y };
      game.players[peer].rx = p.x;
      game.players[peer].ry = p.y;
      game.players[peer].ready = p.ready;
    },
    onGame: g => {
      if (!g) return;
      if (g.status) game.status = g.status;
      if (g.mode) game.mode = g.mode;
      if (g.config) game.cfg = getMode(g.mode);
      if (g.scores) game.scores = { ...game.scores, ...g.scores };
      if (g.turn) { game.turn = g.turn; game.eatenThisTurn = 0; }
      if (g.turnSwitches) game.turnSwitches = g.turnSwitches;
      if (g.status === "ended" && game.status !== "ended") game.status = "ended";
    },
    onFish: f => {
      // 合并远端鱼：新增的加入本地，被移除的删掉；位置不覆盖本地漂移
      const remoteIds = f ? Object.keys(f) : [];
      // 删掉远端已不在且本地也吃不到的
      for (const id in game.fish) {
        if (!f || !f[id]) delete game.fish[id];
      }
      for (const id of remoteIds) {
        if (!game.fish[id]) {
          game.fish[id] = { ...f[id], x: f[id].x, y: f[id].y, vx: f[id].vx || 0, vy: f[id].vy || 0 };
        }
      }
    },
  });

  lastTs = 0;
  raf = requestAnimationFrame(frame);
}

export function destroy() {
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  if (unbindInput) unbindInput();
  unbindInput = null;
  window.removeEventListener("resize", resize);
  window.removeEventListener("orientationchange", resize);
}

/** 供 main.js 结算读取当前权威状态快照 */
export function getState() {
  return {
    mode: game.mode,
    status: game.status,
    scores: { ...game.scores },
    cfg: game.cfg,
  };
}
