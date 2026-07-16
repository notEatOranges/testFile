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

module.exports = { RED, BLUE, seatOf, peerSeatOf, seatRole, keyPath, bind, setState, updateState, teardown };
