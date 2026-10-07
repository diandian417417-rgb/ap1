// interaction.js —— 鼠标（平移/缩放）与键盘交互
// 直接操作传入的相机对象 cam：{ center:[x,y], scale }

export function attachMouse(canvas, cam) {
  let dragging = false;
  let lastX = 0, lastY = 0;

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { dragging = true; lastX = e.clientX; lastY = e.clientY; }
  });
  window.addEventListener('mouseup', () => { dragging = false; });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    // 像素位移 → 世界位移（除以 scale），屏幕向下 = 世界向下
    cam.center[0] -= (2 * dx / w) / cam.scale;
    cam.center[1] += (2 * dy / h) / cam.scale;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    // 光标位置对应的 NDC 坐标
    const ndcX = 2 * cx / w - 1;
    const ndcY = 1 - 2 * cy / h;

    const s1 = cam.scale;
    const s2 = Math.min(200, Math.max(0.2, s1 * Math.exp(-e.deltaY * 0.0015)));
    // 让光标下的世界点在缩放前后保持不动
    cam.center[0] += ndcX / (2 * s1) - ndcX / (2 * s2);
    cam.center[1] += ndcY / (2 * s1) - ndcY / (2 * s2);
    cam.scale = s2;
  }, { passive: false });
}

export function attachKeyboard(onKey) {
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') e.preventDefault(); // 避免空格滚动页面
    onKey(e.key);
  });
}