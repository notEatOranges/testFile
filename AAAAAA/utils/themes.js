// themes.js —— JS 主题对象（供 Canvas 游戏取色，替代原 getComputedStyle 读 CSS 变量）
// 颜色与 love-theme.wxss 的 .theme-xxx 完全对应。catfish/snake 等游戏迁移时从这里取色。
const THEMES = {
  sakura:    { name: '樱花粉', primary: '#ff7aa2', primaryDeep: '#e85a86', bg1: '#fff5f7', bg2: '#ffe4ec', text: '#5a3d4a', textSoft: '#8a6b78', accent: '#ff9eb5' },
  mint:      { name: '薄荷绿', primary: '#5bb89e', primaryDeep: '#3fa286', bg1: '#f0fbf6', bg2: '#d7f2e3', text: '#2f4a40', textSoft: '#5e786d', accent: '#7fd0b0' },
  lavender:  { name: '薰衣草', primary: '#9b7fd4', primaryDeep: '#7d61c0', bg1: '#f6f2fc', bg2: '#e6dcf5', text: '#3d3553', textSoft: '#6b6188', accent: '#b59ce0' },
  peach:     { name: '蜜桃橙', primary: '#ff9a6c', primaryDeep: '#f17844', bg1: '#fff3ec', bg2: '#ffe4d4', text: '#5a3d2e', textSoft: '#8a6b58', accent: '#ffb088' },
  babyblue:  { name: '奶蓝',   primary: '#6db4e8', primaryDeep: '#4f93cf', bg1: '#eef6fd', bg2: '#d6ebfa', text: '#2f414e', textSoft: '#5e7787', accent: '#8cc4ee' },
  lemon:     { name: '奶酪黄', primary: '#e8b94d', primaryDeep: '#c99a2f', bg1: '#fff9e8', bg2: '#fff0c8', text: '#4d4128', textSoft: '#7a6c4e', accent: '#eecb6e' },
  berry:     { name: '莓莓红', primary: '#e87090', primaryDeep: '#cf4f73', bg1: '#fff0f3', bg2: '#ffdde4', text: '#4d2e36', textSoft: '#7a5862', accent: '#ee8ba6' },
  cocoa:     { name: '可可棕', primary: '#b08968', primaryDeep: '#8c6a4f', bg1: '#f7f1ea', bg2: '#ecdfd0', text: '#3d2f24', textSoft: '#6d5b4a', accent: '#bd9a7d' }
};

const THEME_LIST = Object.keys(THEMES).map(k => ({ key: k, name: THEMES[k].name }));

function getTheme(name) { return THEMES[name] || THEMES.sakura; }

module.exports = { THEMES, THEME_LIST, getTheme };
