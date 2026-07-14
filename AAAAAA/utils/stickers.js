// stickers.js —— 内置表情包清单
// 用法：把表情图片放进 /assets/stickers/，然后在下面数组登记，即可在聊天表情面板「表情包」页的「内置」区出现。
// 收藏的表情不走这里（存在 kv stickers/{role}），无需在此登记。
//
// 示例（取消注释并把图片放到对应路径即生效）：
//   { key: 'hi', src: '/assets/stickers/hi.png' },
//   { key: 'love', src: '/assets/stickers/love.png' },
const BUILTIN_STICKERS = [
  // { key: 'hi', src: '/assets/stickers/hi.png' },
];

module.exports = { BUILTIN_STICKERS };
