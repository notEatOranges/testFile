/* ============================================================
   入口编排：初始化主题/数据/路由，处理引导（房间号+身份）
   ============================================================ */

import { Store } from "./core/store.js";
import * as room from "./core/room.js";
import { initSwitcher } from "./core/theme.js";
import * as router from "./core/router.js";
import { toast, roleFull, escapeHtml } from "./core/utils.js";

import * as home from "./views/home.js";
import * as chat from "./views/chat.js";
import * as mood from "./views/mood.js";
import * as days from "./views/days.js";
import * as wishlist from "./views/wishlist.js";
import * as truthbox from "./views/truthbox.js";

function defineViews() {
  router.define("home",     { title: "我们的小窝", onEnter: home.mount,     onLeave: home.unmount });
  router.define("chat",     { title: "悄悄对话",   onEnter: chat.mount,     onLeave: chat.unmount });
  router.define("mood",     { title: "今日心情",   onEnter: mood.mount,     onLeave: mood.unmount });
  router.define("days",     { title: "在一起",     onEnter: days.mount,     onLeave: days.unmount });
  router.define("wishlist", { title: "心愿清单",   onEnter: wishlist.mount, onLeave: wishlist.unmount });
  router.define("truthbox", { title: "真心话",     onEnter: truthbox.mount, onLeave: truthbox.unmount });
  router.define("heart",    { title: "3D 爱心",    iframe: "./heart.html",   heart: true });
  router.define("catfish",  { title: "猫猫吃鱼",   iframe: "./catfish.html" });
}

let pickedRole = null;

/** 在引导页选中某个身份卡（同步 pickedRole + 视觉高亮） */
function selectRole(role) {
  pickedRole = role;
  document.querySelectorAll("#onboarding .role-card").forEach(x => {
    x.classList.toggle("sel", x.dataset.role === role);
  });
}

/** 统一进入入口：走 room.enter（含 2 人容量检查）。成功→进主应用。 */
async function doEnter(roomCode, role) {
  const ok = await room.enter(roomCode, role);
  if (!ok) { toast("这个身份已经有人啦，换一个～"); return false; }
  enterApp();
  toast("欢迎回家 ♥");
  return true;
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
    const r = el.dataset.room, role = el.dataset.role;
    document.getElementById("roomInput").value = r;
    selectRole(role);
    await doEnter(r, role);
  });
  box.querySelectorAll(".rh-del").forEach(el => el.onclick = (e) => {
    e.stopPropagation();
    room.removeRoomHistory(el.dataset.del);
    renderRoomHistory();
  });
  const clr = document.getElementById("rhClear");
  if (clr) clr.onclick = () => { room.clearRoomHistory(); renderRoomHistory(); };
}

/** 退出当前房间（带确认）→ 回引导页 */
function exitRoom() {
  if (!confirm("确定退出当前房间吗？")) return;
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
    if (!r) { toast("输个房间号～"); return; }
    if (!pickedRole) { toast("选个身份～"); return; }
    await doEnter(r, pickedRole);
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

async function boot() {
  initSwitcher();
  defineViews();
  bindOnboarding();

  // 监听 catfish / heart iframe 发来的 go-home 消息
  window.addEventListener("message", e => {
    if (e.data && e.data.type === "cf-go-home") router.go("home");
  });
  await Store.init();

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
}

boot();
