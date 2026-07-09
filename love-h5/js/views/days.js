/* 在一起天数 + 纪念日倒计时：anniversary={startDate}, anniversary/events={id:{title,date,ts}} */
import { Store } from "../core/store.js";
import { daysBetween, daysUntil, escapeHtml, toast, withLoading } from "../core/utils.js";

let u1 = null, u2 = null;

export function mount() {
  const el = document.getElementById("view-days");
  el.innerHTML = `
    <div id="daysHero"></div>
    <div class="section-title">🎉 纪念日 / 倒数</div>
    <div id="eventList"></div>
    <div class="card mt16">
      <div class="bold" style="margin-bottom:10px">➕ 添加纪念日</div>
      <input id="evTitle" class="input" placeholder="名称（如 领证 / 生日）" />
      <input id="evDate" class="input mt8" type="date" />
      <button class="btn btn-primary btn-block mt8" id="evAdd">添加</button>
      <div class="section-title" style="margin-top:18px">💑 在一起的日子</div>
      <input id="startDate" class="input" type="date" />
      <button class="btn btn-primary btn-block mt8" id="startSave">保存起始日</button>
    </div>`;

  u1 = Store.onValue("anniversary", data => renderHero(data && data.startDate));
  u2 = Store.onList("anniversary/events", items => renderEvents(items));

  document.getElementById("evAdd").onclick = function () {
    const t = document.getElementById("evTitle").value.trim();
    const d = document.getElementById("evDate").value;
    if (!t || !d) { toast("填完整～"); return; }
    withLoading(this, async () => {
      await Store.push("anniversary/events", { title: t, date: d, ts: Store.now() });
      document.getElementById("evTitle").value = "";
      document.getElementById("evDate").value = "";
      toast("已添加 🎉");
    }, "添加中…");
  };
  document.getElementById("startSave").onclick = function () {
    const d = document.getElementById("startDate").value;
    if (!d) { toast("选个日期～"); return; }
    withLoading(this, async () => {
      await Store.update("anniversary", { startDate: d });
      toast("已设置 ♥");
    }, "保存中…");
  };
}

function renderHero(sd) {
  const el = document.getElementById("daysHero");
  if (!sd) {
    el.innerHTML = `<div class="days-hero"><div><span class="big">?</span> <span class="unit">天</span></div><div class="since">先设置「在一起的日子」吧</div></div>`;
    return;
  }
  el.innerHTML = `<div class="days-hero"><div><span class="big">${daysBetween(sd)}</span> <span class="unit">天</span></div><div class="since">从 ${sd} 起的每一天 💕</div></div>`;
}

function renderEvents(items) {
  const el = document.getElementById("eventList");
  if (!items.length) { el.innerHTML = `<div class="empty">还没有纪念日，加一个吧</div>`; return; }
  el.innerHTML = items.map(e => {
    const n = daysUntil(e.date); const past = n < 0;
    return `<div class="anniv-card">
      <div class="count ${past ? "past" : ""}">${Math.abs(n)}<div style="font-size:11px">${past ? "天前" : "天后"}</div></div>
      <div><div class="ttl">${escapeHtml(e.title)}</div><div class="dt">${e.date}</div></div>
    </div>`;
  }).join("");
}

export function unmount() { u1 && u1(); u2 && u2(); u1 = u2 = null; }
