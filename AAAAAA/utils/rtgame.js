// rtgame.js —— 双人实时回合制游戏公共层（功能8：联机棋类）
// 座位 = 房间角色：boy=红方(red)，girl=蓝方(blue)，固定。
// 状态存 games/{key}/state，经 Store watch 实时同步（落子即写，对方立即可见，与 drawguess 同模式）。
// 每个游戏页用法：
//   onShow: rt.bind(this, 'gomoku', s => { this._state = s; this.applyState(); });
//   落子:   rt.setState('gomoku', { board, turn, last, winner, moves });
//   onUnload: rt.teardown(this);
const room = require('./room.js');
const { Store } = require('./store.js');

const RED = 'red', BLUE = 'blue';
function seatOf(role) { return role === 'boy' ? RED : BLUE; }            // boy=红方，girl=蓝方
function peerSeatOf(role) { return seatOf(role) === RED ? BLUE : RED; }
function seatRole(seat) { return seat === RED ? 'boy' : 'girl'; }         // 反查：红方=boy
function keyPath(key) { return 'games/' + key + '/state'; }

function bind(page, key, cb) {
  teardown(page);
  page._rtKey = key;
  page._rtUnsub = Store.onValue(keyPath(key), s => cb(s || null));
}
function setState(key, state) { return Store.set(keyPath(key), Object.assign({ ts: Store.now() }, state)); }
function updateState(key, partial) { return Store.update(keyPath(key), partial); }
function teardown(page) {
  if (page._rtUnsub) { page._rtUnsub(); page._rtUnsub = null; }
}

/* —— 通用“重新开局”握手（state.req 字段）：未开局/已结束直接重开；进行中需对方同意 —— */
function requestRestart(key, curState, myRole, isOver, buildFresh) {
  if (!curState || isOver) return setState(key, buildFresh());
  return new Promise(resolve => {
    wx.showModal({
      title: '重新开局', content: '将向对方发起请求，需对方同意才会重开当前对局', confirmText: '发起请求',
      success: r => { if (r.confirm) setState(key, Object.assign({}, curState, { req: { by: myRole } })); resolve(); }
    });
  });
}
function acceptRestart(key, buildFresh) { return setState(key, buildFresh()); }
function rejectRestart(key, curState) { return setState(key, Object.assign({}, curState, { req: null })); }
function cancelRestart(key, curState) { return setState(key, Object.assign({}, curState, { req: null })); }
/** 返回 'mine' | 'peer' | null，供页面 applyState 决定 UI / 弹对方同意框 */
function restartReqSide(req, myRole) {
  if (!req || !req.by) return null;
  return req.by === myRole ? 'mine' : 'peer';
}

/* —— 认输：直接判负，并清掉未处理的重开/悔棋请求 —— */
function resign(key, curState, myRole) {
  return setState(key, Object.assign({}, curState, { winner: peerSeatOf(myRole), req: null, undoReq: null }));
}

/* —— 对战结果记入成绩榜（win/draw/lose → 积分 3/1/0）—— */
function recordPvp(game, result, myRole) {
  const score = result === 'win' ? 3 : (result === 'draw' ? 1 : 0);
  return Store.push('gameScores', { game, role: myRole, score, result, ts: Store.now() });
}
/** 由 winner(seat|'draw') 与我的座位推我的结果 */
function myResult(winner, mySeat) {
  if (winner === 'draw') return 'draw';
  return winner === mySeat ? 'win' : 'lose';
}

module.exports = {
  RED, BLUE, seatOf, peerSeatOf, seatRole, keyPath,
  bind, setState, updateState, teardown,
  requestRestart, acceptRestart, rejectRestart, cancelRestart, restartReqSide,
  resign, recordPvp, myResult
};
