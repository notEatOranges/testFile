/* ============================================================
   三模式规则差异 —— modes.js
   | | versus对战 | coop合作 | turn回合 |
   | 分数 | 各算 scores.{role} | 共享 scores.shared | 当前回合者 scores.{role} |
   | 结束 | 限时到，分高者赢 | shared>=targetFish 过关 | 固定回合数用尽，分高者赢 |
   | 移动 | 双方同时 | 双方同时 | 仅 turn.current 的猫能动 |

   每个模式导出：常量配置 + 钩子(canMove/addScore/tick/shouldEnd/turnSwitch)。
   engine.js 通过 MODE_CONFIG[mode] 调用，不写死规则。
   ============================================================ */

export const MODE_CONFIG = {
  versus: {
    name: "对战",
    duration: 45,            // 秒，限时
    targetFish: 999,
    maxTurns: 999,
    canMove(game, role) { return true; },                          // 双方同时
    scorePath(score) { return score === "shared" ? "shared" : score; }, // 各算
    addScore(scores, role) {
      scores[role] = (scores[role] || 0) + 1;
    },
    shouldEnd(game) {
      return game.elapsed >= MODE_CONFIG.versus.duration;
    },
    winner(game) {
      const b = game.scores.boy || 0, g = game.scores.girl || 0;
      if (b === g) return "draw";
      return b > g ? "boy" : "girl";
    },
    summary(game) {
      const b = game.scores.boy || 0, g = game.scores.girl || 0;
      return `男生 ${b} · 女生 ${g}`;
    },
  },

  coop: {
    name: "合作",
    duration: 90,
    targetFish: 15,
    maxTurns: 999,
    canMove(game, role) { return true; },                          // 双方同时
    addScore(scores, role) {
      scores.shared = (scores.shared || 0) + 1;                    // 共享池
    },
    shouldEnd(game) {
      return (game.scores.shared || 0) >= MODE_CONFIG.coop.targetFish ||
             game.elapsed >= MODE_CONFIG.coop.duration;
    },
    winner(game) {
      const done = (game.scores.shared || 0) >= MODE_CONFIG.coop.targetFish;
      return done ? "shared" : "fail";                             // 达标=共同胜利
    },
    summary(game) {
      return `共同 ${game.scores.shared || 0} / ${MODE_CONFIG.coop.targetFish}`;
    },
  },

  turn: {
    name: "回合",
    duration: 120,
    targetFish: 999,
    maxTurns: 6,                // 每人 3 回合，共 6 次切换
    turnEatLimit: 5,            // 单回合吃够这条鱼或超时则换人
    canMove(game, role) {
      const t = game.turn;
      return t && t.current === role;                              // 仅当前回合能动
    },
    addScore(scores, role) {
      scores[role] = (scores[role] || 0) + 1;
    },
    // 每帧由 engine 调用：判断是否该换人
    tickTurn(game, eatenThisTurn) {
      const cfg = MODE_CONFIG.turn;
      const t = game.turn;
      if (!t) return false;
      const since = (game.now - t.switchedAt) / 1000;
      const timeout = 12;                       // 单回合最多 12s
      if (eatenThisTurn >= cfg.turnEatLimit || since >= timeout) {
        return true;                            // 引擎据此切换
      }
      return false;
    },
    shouldEnd(game) {
      return (game.turnSwitches || 0) >= MODE_CONFIG.turn.maxTurns;
    },
    winner(game) {
      const b = game.scores.boy || 0, g = game.scores.girl || 0;
      if (b === g) return "draw";
      return b > g ? "boy" : "girl";
    },
    summary(game) {
      const b = game.scores.boy || 0, g = game.scores.girl || 0;
      return `男生 ${b} · 女生 ${g}`;
    },
  },
};

export function getMode(mode) { return MODE_CONFIG[mode] || MODE_CONFIG.versus; }
export const MODE_LIST = [
  { id: "versus", ic: "⚔️", n: "对战", d: "限时内分高者赢" },
  { id: "coop", ic: "🤝", n: "合作", d: "一起凑够目标" },
  { id: "turn", ic: "🔁", n: "回合", d: "轮流吃，分高者赢" },
];
