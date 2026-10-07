// renderer.js —— WebGL 2.0 渲染器：着色器、VBO、绘制
import { createProgram } from './gl-utils.js';

// 顶点着色器：把“世界方格”坐标经平移/缩放映射到 NDC，并输出颜色
const VS = `#version 300 es
in vec2 aPosition;
in vec3 aColor;
uniform vec2  uCenter;
uniform float uScale;
uniform float uPointSize;
out vec3 vColor;
void main() {
  vec2 p   = (aPosition - uCenter) * uScale; // 世界方格内平移 + 缩放
  vec2 ndc = p * 2.0;                        // [0,1] -> [-1,1]
  gl_Position  = vec4(ndc, 0.0, 1.0);
  gl_PointSize = uPointSize;
  vColor = aColor;
}`;

// 片元着色器：直出插值颜色；点云模式下把方形点裁成圆点
const FS = `#version 300 es
precision highp float;
uniform bool uRound;
in vec3 vColor;
out vec4 outColor;
void main() {
  if (uRound) {
    vec2 d = gl_PointCoord - vec2(0.5);
    if (dot(d, d) > 0.25) discard;
  }
  outColor = vec4(vColor, 1.0);
}`;

export class FractalRenderer {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: true });
    if (!gl) throw new Error('浏览器不支持 WebGL 2.0');
    this.canvas = canvas;
    this.gl = gl;

    this.program = createProgram(gl, VS, FS);
    this.aPosition = gl.getAttribLocation(this.program, 'aPosition');
    this.aColor = gl.getAttribLocation(this.program, 'aColor');
    this.u = {
      center: gl.getUniformLocation(this.program, 'uCenter'),
      scale: gl.getUniformLocation(this.program, 'uScale'),
      pointSize: gl.getUniformLocation(this.program, 'uPointSize'),
      round: gl.getUniformLocation(this.program, 'uRound'),
    };

    // VAO + VBO：交错存储 [x, y, r, g, b]
    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    const stride = 5 * Float32Array.BYTES_PER_ELEMENT;
    gl.enableVertexAttribArray(this.aPosition);
    gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.aColor);
    gl.vertexAttribPointer(this.aColor, 3, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    gl.bindVertexArray(null);

    gl.clearColor(0.02, 0.03, 0.04, 1.0);
    this.vertexCount = 0;
    this.resize();
  }

  // 跟随容器尺寸 & 高 DPI 屏幕调整画布分辨率
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.dpr = dpr;
  }

  // 上传几何数据（参数变化时调用）
  setData(interleaved) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.DYNAMIC_DRAW);
    this.vertexCount = interleaved.length / 5;
  }

  // 每帧绘制：count 为当前可见顶点数（用于逐点生长）
  draw({ mode, count, center, scale, pointSize, round }) {
    const gl = this.gl;
    this.resize();
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (count <= 0) return;
    gl.useProgram(this.program);
    gl.uniform2f(this.u.center, center[0], center[1]);
    gl.uniform1f(this.u.scale, scale);
    gl.uniform1f(this.u.pointSize, pointSize * this.dpr);
    gl.uniform1i(this.u.round, round ? 1 : 0);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(mode, 0, count);
  }
}