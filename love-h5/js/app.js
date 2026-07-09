/* ============================================================
   入口编排：初始化主题/数据/路由，处理引导（房间号+身份）
   ============================================================ */

import { Store } from "./core/store.js";
import * as room from "./core/room.js";
import { initSwitcher } from "./core/theme.js";
import * as router from "./core/router.js";
import { toast } from "./core/utils.js";

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

function bindOnboarding() {
  const ob = document.getElementById("onboarding");
  ob.querySelectorAll(".role-card").forEach(c => c.onclick = () => {
    ob.querySelectorAll(".role-card").forEach(x => x.classList.remove("sel"));
    c.classList.add("sel");
    pickedRole = c.dataset.role;
  });
  document.getElementById("enterBtn").onclick = async () => {
    const r = document.getElementById("roomInput").value.trim();
    if (!r) { toast("输个房间号～"); return; }
    if (!pickedRole) { toast("选个身份～"); return; }
    await room.enter(r, pickedRole);
    enterApp();
    toast("欢迎回家 ♥");
  };
  document.getElementById("backBtn").onclick = () => router.go("home");
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
  await Store.init();

  if (room.isSetup()) {
    await room.enter(room.getRoom(), room.getRole());
    enterApp();
  }
  // 否则保持引导页可见
}

boot();
