// 大富翁棋盘图标表：每个语义一份三主题素材。
// t = TDesign 图标 name；e = emoji；i = twemoji/openmoji codepoint(对应 assets/monopoly-icons/<i>.png，9.9h 下载打包)。
// 9.9b 先用 t(t-icon)；9.9g/h 接 emoji 与本地图片主题，按 iconTheme 切。
// 注：TDesign 缺 coffee/flower/beach/firework/hotspring/parking 6 个语义，用近似图标兜底。
module.exports = {
  shop: {                 // 18 个地产名 → 店铺图标
    '棉花糖摊': { t: 'candy',        e: '🍡',   i: '1f36f' },
    '奶茶店':   { t: 'tea',          e: '🧋',   i: '1f9cb' },
    '电影院':   { t: 'film',         e: '🎬',   i: '1f3ac' },
    '咖啡馆':   { t: 'tea',          e: '☕',   i: '2615' },     // 缺 coffee，用 tea
    '书店':     { t: 'book',         e: '📚',   i: '1f4da' },
    '花店':     { t: 'gift',         e: '💐',   i: '1f490' },     // 缺 flower
    '游乐场':   { t: 'ferris-wheel', e: '🎢',   i: '1f3a2' },
    '海滩':     { t: 'watermelon',   e: '🏖️',  i: '1f3d6-fe0f' }, // 缺 beach
    '摩天轮':   { t: 'ferris-wheel', e: '🎡',   i: '1f3a1' },
    '甜品屋':   { t: 'cake',         e: '🍰',   i: '1f382' },
    '民宿':     { t: 'home',         e: '🏠',   i: '1f3e0' },
    '烟火大会': { t: 'star',         e: '🎆',   i: '1f386' },     // 缺 firework
    '星空营地': { t: 'moon',         e: '🌌',   i: '1f30c' },
    '音乐节':   { t: 'music',        e: '🎵',   i: '1f3b5' },
    '滑雪场':   { t: 'snowflake',    e: '⛷️',  i: '26f7-fe0f' },
    '温泉':     { t: 'location',     e: '♨️',  i: '2668-fe0f' }, // 缺 hot-spring
    '灯塔':     { t: 'lighthouse',   e: '🗼',   i: '1f5fc' },
    '古镇':     { t: 'castle-1',     e: '🏯',   i: '1f3ef' }
  },
  // 功能格
  start:    { t: 'flag-1',     e: '🚩', i: '1f6a9' },
  jail:     { t: 'lock-on',    e: '⛓️', i: '26d3-fe0f' },
  bonus:    { t: 'gift',       e: '🎁', i: '1f381' },
  freepark: { t: 'location',   e: '🅿️', i: '1f17f' },     // 缺 parking，用定位
  tax:      { t: 'percent',    e: '💸', i: '1f4b8' },
  card:     { t: 'card',       e: '❓', i: '2753' },       // 机会
  fate:     { t: 'money',      e: '💰', i: '1f4b0' },       // 公共基金
  // 升级建筑(经典 Monopoly：1-2 级绿房子，3 级红酒店)
  house:    { t: 'home',       e: '🏠', i: '1f3e0' },
  hotel:    { t: 'building-2', e: '🏨', i: '1f3e8' },
  // 标记
  fullset:   { t: 'star-filled', e: '★',  i: '2b50' },
  mortgaged: { t: 'lock-on',     e: '🔒', i: '1f512' },
  tokenRed:  { t: 'heart',       e: '❤️', i: '2764' },
  tokenBlue: { t: 'star',        e: '💙', i: '1f535' }
};
