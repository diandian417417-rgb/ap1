# AP1 · 交互式 2D 分形（Sierpinski 垫片）

基于 **原生 WebGL 2.0 + JavaScript**（无构建步骤）实现的交互式 Sierpinski 垫片，
分别用 **混沌游戏** 与 **递归细分** 两种算法生成同一图形，支持点云 / 线框 / 实体三种渲染模式、
鼠标与键盘交互、参数实时调节。

## 一、运行方式

使用了 ES Module，**必须通过静态服务器打开**（浏览器禁止从 file:// 加载模块）：

    python -m http.server 8000

然后访问 http://localhost:8000 。部署到 GitHub Pages 即可得到公网 URL。

## 二、目录结构

    ap1/
    ├── index.html        页面骨架 + 参数面板
    ├── css/style.css
    ├── js/
    │   ├── main.js       入口：串联 + 主循环
    │   ├── geometry.js   两种生成算法
    │   ├── renderer.js   着色器 / VBO / 绘制
    ├── gl-utils.js   着色器编译封装
    │   ├── interaction.js 鼠标 + 键盘
    │   ├── ui.js         参数面板
    │   └── config.js     配色 + 默认参数
    └── README.md

## 三、两种生成算法

1) 混沌游戏：p = (p + 随机顶点) / 2，丢弃前 30 步暂态后记录，点收敛到垫片。
2) 递归细分：三角形按中位线切成 4 份，保留三个角上的子三角形并递归；深度 d 得 3^d 个叶三角形。

## 四、交互说明

- 左键拖动：平移；滚轮：以光标为中心缩放
- 1 / 2 / 3：切换 点云 / 线框 / 实体
- 空格：暂停 / 继续逐点生长动画
- 面板：算法、顶点数、深度、点大小、配色、多边形边数 n

## 五、截图

- docs/shot-points.png — 混沌游戏 · 点云
- docs/shot-lines.png — 递归细分 · 线框
- docs/shot-triangles.png — 递归细分 · 实体

## 六、参考与致谢

教材：Angel & Shreiner, Interactive Computer Graphics, 8th ed.（Ch2–3）。
js/gl-utils.js 为自写封装，作用等价于教材 Common/initShaders.js。