// geometry.js —— 两种分形生成算法（纯计算，不碰 WebGL）
// 所有坐标都落在 [0,1]×[0,1] 的“世界方格”里，渲染阶段再做平移/缩放。

/**
 * 正 n 边形顶点（默认外接圆半径 0.45，居中于 (0.5,0.5)）
 * n=3 就是初始大三角形；n>3 用于 E1 的多边形垫片。
 */
export function regularPolygonVertices(n, radius = 0.45, center = [0.5, 0.5]) {
  const verts = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI / 2 + (2 * Math.PI * i) / n; // 从正上方开始
    verts.push([
      center[0] + radius * Math.cos(a),
      center[1] + radius * Math.sin(a),
    ]);
  }
  return verts;
}

/**
 * 算法一：混沌游戏（随机迭代）
 * 从随机初始点出发，反复执行  p = (p + 随机顶点) / 2 ，
 * 前若干步是“暂态”，丢弃后再开始记录，点会迅速收敛到吸引子（垫片）上。
 * 返回值：Float32Array，每 3 个一组 (x, y, t)，t 用于配色。
 */
export function chaosGame(count, vertices, rng = Math.random) {
  const k = vertices.length;
  const out = new Float32Array(count * 3);
  let px = 0.5, py = 0.5;

  const burn = 30; // 丢弃的暂态步数
  for (let i = 0; i < burn; i++) {
    const vi = (rng() * k) | 0;
    px = (px + vertices[vi][0]) / 2;
    py = (py + vertices[vi][1]) / 2;
  }
  for (let i = 0; i < count; i++) {
    const vi = (rng() * k) | 0;
    px = (px + vertices[vi][0]) / 2;
    py = (py + vertices[vi][1]) / 2;
    out[i * 3] = px;
    out[i * 3 + 1] = py;
    out[i * 3 + 2] = k > 1 ? vi / (k - 1) : 0; // 按“被吸引到的顶点”着色
  }
  return out;
}

function mid(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/**
 * 算法二：递归细分
 * 把三角形用三边中点连成的三条中位线切成 4 份，保留三个角上的子三角形，
 * 去掉中间那个；对每个角上的子三角形递归。深度 d 得到 3^d 个叶三角形。
 */
export function subdivide(tri, depth, out = []) {
  if (depth <= 0) {
    out.push(tri);
    return out;
  }
  const [a, b, c] = tri;
  const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
  subdivide([a, ab, ca], depth - 1, out);
  subdivide([ab, b, bc], depth - 1, out);
  subdivide([ca, bc, c], depth - 1, out);
  return out;
}

/**
 * 把混沌游戏的 (x,y,t) 数组转成 GPU 用的交错缓冲 [x,y,r,g,b, ...]
 */
export function pointsToInterleaved(points, sample) {
  const n = points.length / 3;
  const out = new Float32Array(n * 5);
  for (let i = 0; i < n; i++) {
    const c = sample(points[i * 3 + 2]);
    out[i * 5] = points[i * 3];
    out[i * 5 + 1] = points[i * 3 + 1];
    out[i * 5 + 2] = c[0];
    out[i * 5 + 3] = c[1];
    out[i * 5 + 4] = c[2];
  }
  return out;
}

/**
 * 把细分得到的叶三角形按渲染模式展开成交错缓冲：
 *   points    → 每个三角形 3 个顶点（当点云画）
 *   lines     → 每个三角形 3 条边 = 6 个顶点
 *   triangles → 每个三角形 3 个顶点（实体填充）
 */
export function trianglesToInterleaved(leaves, mode, sample) {
  const T = leaves.length;
  const out = new Float32Array(T * 6 * 5); // 预留足够空间
  let p = 0;
  for (let i = 0; i < T; i++) {
    const [a, b, c] = leaves[i];
    const col = sample(T > 1 ? i / (T - 1) : 0);
    const verts = mode === 'lines' ? [a, b, b, c, c, a] : [a, b, c];
    for (const v of verts) {
      out[p++] = v[0];
      out[p++] = v[1];
      out[p++] = col[0];
      out[p++] = col[1];
      out[p++] = col[2];
    }
  }
  return out.subarray(0, p); // 裁掉多余空间
}