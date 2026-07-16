// game-rules —— 游戏玩法教程弹层（功能8）。用法：
//   <game-rules game-key="memory" open="{{rulesOpen}}" bind:close="closeRules" />
const RULES = require('@utils/gameRules.js');

Component({
  properties: {
    gameKey: { type: String, value: '' },
    open: { type: Boolean, value: false }
  },
  data: { rules: null },
  observers: {
    'gameKey'(k) { this.setData({ rules: RULES[k] || null }); }
  },
  methods: {
    close() { this.triggerEvent('close'); },
    noop() {}
  }
});
