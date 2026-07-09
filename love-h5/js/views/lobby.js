/* 游戏大厅：错位宫格展示双人小游戏。
 *  status: 'play' 已上线（catfish） / 'soon' 开发中（点给予提示，后续逐个实装）。 */
import { go } from "../core/router.js";
import { toast } from "../core/utils.js";

const GAMES = [
  { id: "catfish", ic: "🐟", n: "猫猫吃鱼",   d: "联机 对战/合作", span: "w2", status: "play" },
  { id: "snake",   ic: "🐍", n: "贪吃蛇",     d: "比谁更长",      span: "t2", status: "play" },
  { id: "tetris",  ic: "🧱", n: "俄罗斯方块", d: "消行对战",      span: "",   status: "soon" },
  { id: "trapcat", ic: "🐱", n: "围住神经猫", d: "六边形围猫",    span: "",   status: "play" },
  { id: "flyer",   ic: "🚀", n: "双人飞行器", d: "空战对决",      span: "w2", status: "soon" },
  { id: "quiz",    ic: "💬", n: "默契问答",   d: "测测默契度",    span: "",   status: "play" },
  { id: "memory",  ic: "🃏", n: "记忆配对",   d: "情侣翻牌",      span: "",   status: "play" },
  { id: "synctap", ic: "🎵", n: "心动节拍",   d: "同步点击",      span: "t2", status: "soon" },
  { id: "draw",    ic: "🎨", n: "你画我猜",   d: "画给 ta 猜",    span: "w2", status: "soon" },
];

export function mount() {
  const el = document.getElementById("view-lobby");
  const playable = GAMES.filter(g => g.status === "play").length;
  el.innerHTML = `
    <div class="lobby-head">
      <div class="lobby-title">🎮 游戏大厅</div>
      <div class="lobby-sub muted small">和 ta 一起玩 · ${playable} 个已上线，其余筹备中</div>
    </div>
    <div class="lobby-grid">
      ${GAMES.map(g => `
        <div class="game-tile ${g.span} ${g.status}" data-id="${g.id}">
          <div class="gt-ic">${g.ic}</div>
          <div class="gt-body">
            <div class="gt-n">${g.n}</div>
            <div class="gt-d">${g.d}</div>
          </div>
          <div class="gt-tag ${g.status}">${g.status === "play" ? "可玩" : "开发中"}</div>
        </div>`).join("")}
    </div>`;
  el.querySelectorAll(".game-tile").forEach(t => t.onclick = () => {
    const g = GAMES.find(x => x.id === t.dataset.id);
    if (g.status === "play") go(g.id);
    else toast("「" + g.n + "」敬请期待 ✨");
  });
}

export function unmount() {}
