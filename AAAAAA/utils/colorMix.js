// colorMix.js —— 背景图与文字颜色混合（功能1：心情卡片背景图防看不清）
// 思路：把背景图缩绘到 48×48 采样画布 → 取平均 RGB → 算感知亮度 →
//       暗图配白字+深色 scrim，亮图配深字+浅色 scrim（混合 + scrim 双保险保证可读）。
// 用法（页面需有一个隐藏的 <canvas type="2d" id="bgCanvas">）：
//   const { textColor, scrim } = await analyzeImage(canvasNode, src)
const SAMPLE = 48;

function analyzeImage(canvasNode, src) {
  return new Promise(resolve => {
    if (!canvasNode || !src) return resolve(defaultResult());
    const ctx = canvasNode.getContext('2d');
    const img = canvasNode.createImage();
    img.onload = () => {
      try {
        ctx.clearRect(0, 0, SAMPLE, SAMPLE);
        ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
        const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
        resolve(pick({ r: r / n, g: g / n, b: b / n }));
      } catch (e) {
        resolve(defaultResult());
      }
    };
    img.onerror = () => resolve(defaultResult());
    img.src = src;
  });
}

function pick({ r, g, b }) {
  const L = 0.299 * r + 0.587 * g + 0.114 * b;   // 感知亮度
  const dark = L < 150;
  return {
    avg: { r: Math.round(r), g: Math.round(g), b: Math.round(b) },
    luminance: Math.round(L),
    dark,
    textColor: dark ? '#ffffff' : '#1f1f1f',
    scrim: dark
      ? 'linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.55))'
      : 'linear-gradient(180deg, rgba(255,255,255,.20), rgba(255,255,255,.55))'
  };
}

function defaultResult() { return pick({ r: 245, g: 245, b: 245 }); }

module.exports = { analyzeImage, pick };
