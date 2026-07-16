// roll-first —— 开局掷骰决定先手（动画+揭晓），各对战游戏复用
// 用法：<roll-first open="{{rollFirst.open}}" result="{{rollFirst.result}}" my-name="{{myName}}" peer-name="{{peerName}}" />
// 页面：startMatch 里 open:true,result:'' → ~820ms 后 result:'me'|'peer' → ~950ms 后 open:false，并写 state.turn=先手方
Component({
  properties: {
    open: { type: Boolean, value: false },
    result: { type: String, value: '' },     // '' | 'me' | 'peer'
    myName: { type: String, value: '我' },
    peerName: { type: String, value: 'ta' }
  },
  data: { face: 1 },
  observers: {
    'open, result'(open, result) {
      if (open && !result) this.startTumble();
      else this.stopTumble();
    }
  },
  lifetimes: { detached() { this.stopTumble(); } },
  methods: {
    startTumble() {
      this.stopTumble();
      this._t = setInterval(() => { this.setData({ face: 1 + Math.floor(Math.random() * 6) }); }, 90);
    },
    stopTumble() { if (this._t) { clearInterval(this._t); this._t = null; } }
  }
});
