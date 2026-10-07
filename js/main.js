// main.js —— 应用入口：把 几何 / 渲染 / 交互 / UI 串起来
import { DEFAULTS, makeSampler } from './config.js';
import {
  regularPolygonVertices, chaosGame, subdivide,
  pointsToInterleaved, trianglesToInterleaved,
} from './geometry.js';
import { FractalRenderer } from './renderer.js';
import { attachMouse, attachKeyboard } from './interaction.js';
import { initUI } from './ui.js';

const canvas = document.getElementById('gl');
let renderer;
try {
  renderer = new FractalRenderer(canvas);
} catch (err) {
  document.getElementById('stage').innerHTML =
    '<p style="color:#f88;padding:24px">无法初始化 WebGL 2.0：' + err.message + '</p>';
  throw err;
}

// —— 全局状态（唯一数据源）——
const state = {
  ...DEFAULTS,
  center: [0.5, 0.5], // 相机中心（世界方格坐标）
  scale: 1,           // 缩放倍数
  paused: false,
  visible: 0,         // 已“生长”出的顶点数
  total: 0,           // 顶点总数
  primSize: 1,        // 每个图元占用的顶点数：点 1 / 线 2 / 三角 3
  glMode: 0,          // gl.POINTS / gl.LINES / gl.TRIANGLES
};

let buffers = new Float32Array(0);

// —— 依据当前参数重建几何并上传到 GPU ——
function rebuild() {
  const sample = makeSampler(state.palette);

  if (state.algorithm === 'chaos') {
    const verts = regularPolygonVertices(state.nSides);
    const pts = chaosGame(state.count, verts);
    buffers = pointsToInterleaved(pts, sample);
    state.total = state.count;
    state.primSize = 1;
    state.glMode = renderer.gl.POINTS;
  } else {
    const base = regularPolygonVertices(3);            // 初始大三角形
    const leaves = subdivide(base, state.depth, []);   // 递归细分 → 叶三角形
    buffers = trianglesToInterleaved(leaves, state.renderMode, sample);
    state.primSize = state.renderMode === 'triangles' ? 3 : (state.renderMode === 'lines' ? 2 : 1);
    state.total = buffers.length / 5;
    state.glMode = state.renderMode === 'triangles'
      ? renderer.gl.TRIANGLES
      : (state.renderMode === 'lines' ? renderer.gl.LINES : renderer.gl.POINTS);
  }

  renderer.setData(buffers);
  state.visible = state.paused ? state.total : 0; // 未暂停则从 0 开始逐点生长
}

function resetView() { state.center = [0.5, 0.5]; state.scale = 1; }

// —— 参数面板 ——
const ui = initUI(state, {
  onChange: rebuild,
  onTogglePause: () => { state.paused = !state.paused; },
  onReset: resetView,
});

// —— 鼠标：左键平移 / 滚轮缩放 ——
attachMouse(canvas, state);

// —— 键盘：1/2/3 切渲染模式，空格 暂停/继续 ——
attachKeyboard((key) => {
  if (key === '1') { state.renderMode = 'points'; }
  else if (key === '2') { state.renderMode = 'lines'; state.algorithm = 'subdivision'; }
  else if (key === '3') { state.renderMode = 'triangles'; state.algorithm = 'subdivision'; }
  else if (key === ' ') { state.paused = !state.paused; }
  else return;
  ui.sync();
  rebuild();
});

// —— 主循环 ——
let last = performance.now();
let fpsAcc = 0, fpsFrames = 0, fps = 0;

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // 逐点生长：约 3 秒长满
  const growthRate = state.total / 3;
  if (!state.paused && state.visible < state.total) {
    state.visible = Math.min(state.total, state.visible + growthRate * dt);
  }
  const count = Math.floor(state.visible / state.primSize) * state.primSize;

  renderer.draw({
    mode: state.glMode,
    count,
    center: state.center,
    scale: state.scale,
    pointSize: state.pointSize,
    round: state.glMode === renderer.gl.POINTS,
  });

  fpsAcc += dt; fpsFrames++;
  if (fpsAcc >= 0.5) { fps = Math.round(fpsFrames / fpsAcc); fpsAcc = 0; fpsFrames = 0; }
  ui.setStat(`模式 ${state.renderMode} · 顶点 ${count}/${state.total} · ${fps} FPS`);

  requestAnimationFrame(loop);
}

rebuild();
requestAnimationFrame(loop);