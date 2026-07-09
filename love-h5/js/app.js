/* ============================================================
   入口编排：初始化主题/数据/路由，处理引导（房间号+身份）
   ============================================================ */

import { Store, onLoadingChange } from "./core/store.js";
import * as room from "./core/room.js";
import { initSwitcher } from "./core/theme.js";
import * as router from "./core/router.js";
import { toast, roleFull, escapeHtml } from "./core/utils.js";
import { showConfirm } from "./core/modal.js";

import * as home from "./views/home.js";
import * as chat from "./views/chat.js";
import * as mood from "./views/mood.js";
import * as days from "./views/days.js";
import * as wishlist from "./views/wishlist.js";
import * as truthbox from "./views/truthbox.js";
import * as lobby from "./views/lobby.js";

function defineViews() {
  router.define("home",     { title: "我们的小窝", onEnter: home.mount,     onLeave: home.unmount });
  router.define("chat",     { title: "悄悄对话",   onEnter: chat.mount,     onLeave: chat.unmount });
  router.define("mood",     { title: "今日心情",   onEnter: mood.mount,     onLeave: mood.unmount });
  router.define("days",     { title: "在一起",     onEnter: days.mount,     onLeave: days.unmount });
  router.define("wishlist", { title: "心愿清单",   onEnter: wishlist.mount, onLeave: wishlist.unmount });
  router.define("truthbox", { title: "真心话",     onEnter: truthbox.mount, onLeave: truthbox.unmount });
  router.define("lobby",    { title: "游戏大厅",   onEnter: lobby.mount,    onLeave: lobby.unmount });
  router.define("heart",    { title: "3D 爱心",    iframe: "./heart.html",   heart: true });
  router.define("catfish",  { title: "猫猫吃鱼",   iframe: "./catfish.html" });
  router.define("snake",    { title: "贪吃蛇",     iframe: "./snake.html" });
  router.define("memory",   { title: "记忆配对",   iframe: "./memory.html" });
  router.define("quiz",     { title: "默契问答",   iframe: "./quiz.html" });
  router.define("trapcat",  { title: "围住神经猫", iframe: "./trapcat.html" });
}

let pickedRole = null;

/** 在引导页选中某个身份卡（同步 pickedRole + 视觉高亮） */
function selectRole(role) {
  pickedRole = role;
  document.querySelectorAll("#onboarding .role-card").forEach(x => {
    x.classList.toggle("sel", x.dataset.role === role);
  });
}

/** 统一进入入口：先 PIN 门禁，再 room.enter（含 2 人容量检查）。成功→进主应用。 */
async function doEnter(roomCode, role, pin) {
  const pinRes = await room.verifyOrSetPin(roomCode, pin);
  if (!pinRes.ok) { toast(pinRes.reason === "empty" ? "输个房间 PIN～" : "房间 PIN 不对～"); return false; }
  const ok = await room.enter(roomCode, role);
  if (!ok) { toast("这个身份已经有人啦，换一个～"); return false; }
  enterApp();
  toast(pinRes.created ? "房间已创建，欢迎回家 ♥" : "欢迎回家 ♥");
  return true;
}

/** 进入按钮的 loading 态（转圈 + 禁用，防重复点击） */
function setEnterLoading(on) {
  const btn = document.getElementById("enterBtn");
  if (!btn) return;
  btn.disabled = on;
  btn.innerHTML = on ? `<i class="ri-loader-4-line spin"></i> 进入中…` : `进入 ♥`;
}

/** 相对时间文案 */
function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "刚刚";
  if (s < 3600) return Math.floor(s / 60) + " 分钟前";
  if (s < 86400) return Math.floor(s / 3600) + " 小时前";
  return Math.floor(s / 86400) + " 天前";
}

/** 渲染历史房间列表（引导页，点击即重进） */
function renderRoomHistory() {
  const box = document.getElementById("roomHistory");
  if (!box) return;
  const list = room.getRoomHistory();
  if (!list.length) { box.style.display = "none"; box.innerHTML = ""; return; }
  box.style.display = "";
  box.innerHTML =
    `<div class="rh-title">最近房间</div>` +
    list.map(h => {
      const room = escapeHtml(h.room);
      return `<div class="rh-item" data-room="${room}" data-role="${h.role}">
        <img class="rh-av" src="./assets/images/${h.role}.jpg" alt=""/>
        <div class="rh-main"><div class="rh-room">${room}</div><div class="rh-sub">${roleFull(h.role)} · ${relTime(h.ts)}</div></div>
        <span class="rh-del" data-del="${room}" title="删除">✕</span>
      </div>`;
    }).join("") +
    `<button class="rh-clear" id="rhClear">清空历史</button>`;

  box.querySelectorAll(".rh-item").forEach(el => el.onclick = async (e) => {
    if (e.target.classList.contains("rh-del")) return;   // 删除按钮单独处理
    document.getElementById("roomInput").value = el.dataset.room;
    selectRole(el.dataset.role);
    const pin = document.getElementById("pinInput");
    if (pin) pin.focus();   // 历史进入仍需手输 PIN（安全），再点「进入」
  });
  box.querySelectorAll(".rh-del").forEach(el => el.onclick = (e) => {
    e.stopPropagation();
    room.removeRoomHistory(el.dataset.del);
    renderRoomHistory();
  });
  const clr = document.getElementById("rhClear");
  if (clr) clr.onclick = () => { room.clearRoomHistory(); renderRoomHistory(); };
}

/** 退出当前房间（自定义确认弹框）→ 回引导页 */
async function exitRoom() {
  const ok = await showConfirm({
    title: "退出房间",
    message: "确定退出当前房间吗？",
    okText: "退出",
    cancelText: "取消",
    danger: true,
  });
  if (!ok) return;
  room.leave();
  room.clearSetup();                 // 关键：否则下次 boot 自动重进
  document.getElementById("app").style.display = "none";
  document.getElementById("onboarding").style.display = "";
  location.hash = "";                // 触发 router 清掉 catfish/heart iframe
  pickedRole = null;
  document.getElementById("roomInput").value = "";
  document.querySelectorAll("#onboarding .role-card").forEach(x => x.classList.remove("sel"));
  renderRoomHistory();
  toast("已退出房间");
}

function bindOnboarding() {
  const ob = document.getElementById("onboarding");
  ob.querySelectorAll(".role-card").forEach(c => c.onclick = () => selectRole(c.dataset.role));
  document.getElementById("enterBtn").onclick = async () => {
    const r = document.getElementById("roomInput").value.trim();
    const pin = document.getElementById("pinInput").value.trim();
    if (!r) { toast("输个房间号～"); return; }
    if (!pin) { toast("输个房间 PIN～"); return; }
    if (!pickedRole) { toast("选个身份～"); return; }
    setEnterLoading(true);
    try {
      await doEnter(r, pickedRole, pin);
    } finally {
      setEnterLoading(false);
    }
  };
  document.getElementById("backBtn").onclick = () => router.go("home");
  const exitBtn = document.getElementById("exitBtn");
  if (exitBtn) exitBtn.onclick = exitRoom;
  renderRoomHistory();
}

function enterApp() {
  document.getElementById("onboarding").style.display = "none";
  document.getElementById("app").style.display = "";
  router.start();
}

/** 淡出并移除启动 loading */
function hideSplash() {
  const s = document.getElementById("splash");
  if (!s) return;
  s.classList.add("hide");
  setTimeout(() => s.remove(), 400);
}

async function boot() {
  try {
    initSwitcher();
    defineViews();
    bindOnboarding();

    // 监听 catfish / heart iframe 发来的 go-home 消息
    window.addEventListener("message", e => {
      if (e.data && e.data.type === "cf-go-home") router.go("home");
    });
    await Store.init();

    // 进入各页面：有未完成的订阅读取时显示 loading 覆盖（数据到了自动消失）
    onLoadingChange(on => {
      const el = document.getElementById("viewLoading");
      if (el) el.style.display = on ? "" : "none";
    });

    if (room.isSetup()) {
      const ok = await room.enter(room.getRoom(), room.getRole());
      if (ok) {
        enterApp();
      } else {
        // 该身份已被别人占用：清掉记忆，留在引导页让用户重选
        room.clearSetup();
        toast("该身份已有人，请重新选择");
      }
    }
    // 否则保持引导页可见
  } catch (e) {
    console.error("[love-h5] 启动失败:", e);
  } finally {
    hideSplash();   // 无论成败都淡出启动页，避免卡白屏 / 闪登录页
  }
}

boot();
