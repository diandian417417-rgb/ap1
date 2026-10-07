// ui.js —— HTML 参数面板；读/写 state，并通过回调触发重建

export function initUI(state, handlers) {
  const $ = (id) => document.getElementById(id);
  const el = {
    algorithm: $('algorithm'),
    count: $('count'), countVal: $('countVal'),
    depth: $('depth'), depthVal: $('depthVal'),
    mode: $('mode'),
    pointSize: $('pointSize'), pointSizeVal: $('pointSizeVal'),
    palette: $('palette'),
    nSides: $('nSides'), nSidesVal: $('nSidesVal'),
    pauseBtn: $('pauseBtn'),
    resetBtn: $('resetBtn'),
    stat: $('stat'),
  };

  // 把 state 的值同步回控件（键盘改变 state 后需要调用）
  function sync() {
    el.algorithm.value = state.algorithm;
    el.mode.value = state.renderMode;
    el.count.value = state.count;          el.countVal.textContent = state.count;
    el.depth.value = state.depth;          el.depthVal.textContent = state.depth;
    el.pointSize.value = state.pointSize;  el.pointSizeVal.textContent = state.pointSize;
    el.palette.value = state.palette;
    el.nSides.value = state.nSides;        el.nSidesVal.textContent = state.nSides;
    el.pauseBtn.textContent = state.paused ? '▶ 继续生长' : '⏸ 暂停生长';

    // 按当前算法启用/禁用相关控件
    const chaos = state.algorithm === 'chaos';
    el.count.disabled = !chaos;
    el.nSides.disabled = !chaos;
    el.depth.disabled = chaos;
    el.mode.disabled = chaos;
  }

  el.algorithm.addEventListener('change', (e) => { state.algorithm = e.target.value; sync(); handlers.onChange(); });
  el.mode.addEventListener('change', (e) => { state.renderMode = e.target.value; handlers.onChange(); });
  el.count.addEventListener('input', (e) => { state.count = +e.target.value; el.countVal.textContent = state.count; handlers.onChange(); });
  el.depth.addEventListener('input', (e) => { state.depth = +e.target.value; el.depthVal.textContent = state.depth; handlers.onChange(); });
  el.palette.addEventListener('change', (e) => { state.palette = e.target.value; handlers.onChange(); });
  el.nSides.addEventListener('input', (e) => { state.nSides = +e.target.value; el.nSidesVal.textContent = state.nSides; handlers.onChange(); });
  // 点大小只改 uniform，无需重建几何
  el.pointSize.addEventListener('input', (e) => { state.pointSize = +e.target.value; el.pointSizeVal.textContent = state.pointSize; });

  el.pauseBtn.addEventListener('click', () => { handlers.onTogglePause(); sync(); });
  el.resetBtn.addEventListener('click', () => { handlers.onReset(); });

  sync();
  return {
    sync,
    setStat: (text) => { el.stat.textContent = text; },
  };
}