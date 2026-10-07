// config.js —— 配色方案与默认参数

export const PALETTES = {
  // 每个方案是一串颜色“停靠点”，采样时在停靠点之间线性插值
  '霓虹': ['#00e5ff', '#b388ff', '#ff2d95'],
  '日落': ['#ff3d00', '#ff9800', '#ffd54f'],
  '极光': ['#00ffa3', '#00b0ff', '#7c4dff'],
  '霜蓝': ['#0a2a43', '#38bdf8', '#e0f2fe'],
  '单色': ['#ffffff', '#ffffff'],
};

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

// 返回一个采样函数 sample(t)，t∈[0,1] → [r,g,b]
export function makeSampler(name) {
  const stops = (PALETTES[name] || PALETTES['霓虹']).map(hexToRgb);
  return function sample(t) {
    if (stops.length === 1) return stops[0];
    const x = Math.min(1, Math.max(0, t)) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(x));
    const f = x - i;
    const a = stops[i], b = stops[i + 1];
    return [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    ];
  };
}

export const DEFAULTS = {
  algorithm: 'chaos',    // 'chaos' | 'subdivision'
  renderMode: 'points',  // 'points' | 'lines' | 'triangles'
  nSides: 3,             // 混沌游戏的顶点数（3 = 三角垫片）
  count: 20000,          // 混沌游戏顶点数
  depth: 4,              // 递归细分深度
  pointSize: 2,          // 点大小（像素）
  palette: '霓虹',
};