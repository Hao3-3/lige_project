# 泉城智慧出行 · 智慧城市三维地图平台

一个基于 **Vue 3 + Mapbox GL + AntV L7** 构建的智慧城市可视化平台，以济南市为原型，在**三维球状地图**上集成实时公交、地铁、出行人口统计、公交路线规划、天气、空间范围查询等出行服务，呈现"数字孪生 + 智慧出行"的城市场景。

> 项目原名：智慧城市-济南（smart-city / jinan-smart-travel）

---

## ✨ 功能特性

| 功能模块 | 说明 |
| --- | --- |
| 🌍 三维球状地图 | Mapbox `globe` 投影 + 大气雾化，支持地球自转、自由旋转缩放 |
| 🏙️ 真实 3D 建筑 | 基于 Mapbox 建筑矢量数据挤出立体建筑，霓虹渐变色，暗色底图上呈现未来城市感 |
| 🈶 地名汉化 | 地图标注自动优先显示中文地名 |
| 🗺️ 多底图切换 | 导航夜间 / 导航日间 / 卫星街道 / 卫星影像 4 种底图一键切换 |
| 🧭 路线导航 | 集成 Mapbox Directions，支持驾车路线规划与语音播报 |
| 🚌 公交系统 | 济南公交站点 POI 图层，点击查看站点信息 |
| 🚇 地铁系统 | 济南地铁站点图层，点击查看站点信息 |
| 🗺️ 公交路线规划 | 起终点选择 + 地图选点，支持综合 / 地铁优先 / 公交三种模式，展示预计用时、全程里程、途经站点，可全览路线 |
| 📊 出行人口统计 | 济南各区今日出行人口柱状图（G2Plot） |
| 🚍 实时公交在线表 | 济南各区实时公交在线数量玫瑰图（G2Plot） |
| ⛰️ 济南等高线 | 叠加济南等高线图层，呈现地形起伏 |
| 📐 县区规划 | 展示济南区县边界与路网线图层 |
| 🎯 空间范围查询 | 多边形 / 矩形 / 圆形框选，基于 Turf 空间分析查询范围内的生活设施点 |
| ☁️ 实时天气 | 调用高德天气接口，展示济南天气、气温、风级、风向、湿度 |
| ✈️ 飞行济南 | 一键飞行动画定位到济南 |
| 🎨 主题切换 | 暖色 / 冷色配色一键切换 |
| 🕐 实时时钟 | 顶部实时日期时间显示，支持拖拽 |
| 🖱️ 辅助控件 | 全屏切换、鼠标经纬度实时坐标显示 |

---

## 🛠️ 技术栈

| 分类 | 技术 | 用途 |
| --- | --- | --- |
| 前端框架 | [Vue 3](https://vuejs.org/) + [Vite 4](https://vitejs.dev/) | SFC 组件化开发、开发服务器与构建 |
| UI 组件 | [Element Plus](https://element-plus.org/) | 对话框、消息提示等基础组件 |
| 地图引擎 | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) | 三维球状底图、建筑挤出、导航插件 |
| 空间可视化 | [AntV L7](https://l7.antv.antgroup.com/) | 点 / 线 / 面 / 热力等业务图层渲染 |
| 绘制工具 | [@antv/l7-draw](https://l7.antv.antgroup.com/) | 多边形 / 矩形 / 圆形绘制 |
| 图表库 | [AntV G2Plot](https://g2plot.antv.antgroup.com/)（@opd/g2plot-vue） | 柱状图、玫瑰图 |
| 地理计算 | [@turf/turf](https://turfjs.org/) | 空间包含关系判断、几何计算 |
| 数据服务 | [json-server](https://github.com/typicode/json-server) + [mockjs](https://github.com/nuysoft/Mock) | 本地 GIS 数据 Mock 接口 |
| HTTP 请求 | [axios](https://axios-http.com/) | 业务数据与第三方接口请求 |

---

## 📁 项目结构

```
济南智慧出行/
├── index.html                  # 入口 HTML（引入 Mapbox Directions、图标库）
├── vite.config.js              # Vite 配置（含 /amap 高德代理）
├── mock.js                     # json-server Mock 数据入口
├── .env                        # Mapbox Token 等环境变量（已 gitignore）
├── public/
│   └── vite.svg
├── src/
│   ├── main.js                 # 应用入口
│   ├── App.vue                 # 地图初始化（globe 投影、雾化、3D 建筑、汉化）
│   ├── style.css               # 全局样式
│   ├── router/
│   │   └── index.js            # 路由（hash 模式）
│   ├── views/
│   │   ├── home.vue            # 首页：组装各功能组件
│   │   └── G2chart.vue         # 左侧图表面板（人口统计 / 公交在线）
│   ├── components/
│   │   ├── Header.vue          # 顶部标题栏 + 实时时钟 + 主题切换
│   │   ├── smartcity.vue       # 智能城市占位组件
│   │   ├── mapcontrol.vue      # 底图切换 / 导航开关 / 全屏 / 坐标控件
│   │   ├── BottomTools.vue     # 底部工具栏（公交、地铁、路线、天气等）
│   │   ├── DrawTool.vue        # 范围查询绘制工具（L7 Draw + Turf 分析）
│   │   ├── DisplayCard.vue     # 查询结果展示卡片
│   │   └── Panel.vue           # 图表面板容器
│   ├── Hooks/
│   │   ├── map3d.js            # 3D 建筑挤出、地名汉化
│   │   ├── coord.js            # WGS84 / GCJ02 坐标转换
│   │   ├── busOnline.js        # 公交在线数据（Mock）
│   │   ├── peopleOutdoor.js    # 出行人口数据（Mock）
│   │   └── population.js       # 人口数据（Mock）
│   └── assets/                 # 静态资源（图标、底图缩略图、主题图）
└── GIS_DATA/                   # GIS 地理数据（GeoJSON）
    ├── Jinan_builds.json       # 济南建筑
    ├── Jinan_roads.json        # 济南道路
    ├── Jinan_livepoints.json   # 济南生活设施点
    ├── Jinan_line.json         # 济南线数据
    ├── Jinan_lpointc.json      # 济南点数据
    ├── Jinan_highline.json     # 济南等高线
    ├── Jinan_bus_lines.json    # 济南公交线路
    ├── Jinan_bus_stops.json    # 济南公交站点
    ├── Jinan_metro_stations.json # 济南地铁站点
    └── Wenzhou_*/ Zibo_*/      # 温州、淄博扩展数据（备用）
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 16（建议 18+）
- 包管理器：npm / pnpm 均可

### 1. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件（已加入 .gitignore，不会被提交）：

```env
VITE_TOKEN='你的 Mapbox Access Token'
```

> 获取方式：注册 [Mapbox](https://account.mapbox.com/) → 账户页创建 Access Token。Token 缺失时地图底图无法加载。

### 3. 启动 Mock 数据服务（终端 1）

提供济南 GIS 数据接口，默认端口 **8080**：

```bash
npm run mock
```

启动成功后控制台会列出 9 个数据接口，例如 `http://localhost:8080/Jinan_builds`。

### 4. 启动前端开发服务（终端 2）

```bash
npm run dev
```

浏览器自动打开 **http://localhost:5173/** ，即可看到三维球状地图主界面。

> ⚠️ 两个服务需要**同时运行**：Mock 服务提供地图数据，Vite 服务提供页面。

---

## 🧭 功能使用说明

| 操作 | 位置 | 说明 |
| --- | --- | --- |
| 切换底图 | 右上角「导航夜间 / 导航日间 / 卫星街道 / 卫星影像」 | 点击即切换地图风格 |
| 路线导航 | 左上角「导航」按钮 | 打开 Mapbox 驾车导航面板，输入起终点规划路线 |
| 查看图表 | 左侧面板 | 济南各区出行人口柱状图、实时公交在线玫瑰图，可收起 / 展开 |
| 公交 / 地铁 | 底部工具栏 | 点击后加载站点图层，点击站点查看详情 |
| 公交路线规划 | 底部工具栏「公交路线」 | 支持下拉选点与地图选点，选择出行方式后查询，展示途经站点 |
| 范围查询 | 底部工具栏「范围查询」 | 选择多边形 / 矩形 / 圆形绘制范围，自动查询范围内生活设施点 |
| 济南等高 | 底部工具栏 | 叠加等高线图层 |
| 县区规划 | 底部工具栏 | 展示区县边界与路网 |
| 查看天气 | 底部工具栏 | 弹出济南实时天气信息 |
| 飞行济南 | 底部工具栏 | 地图飞行动画定位济南 |
| 控制中心 | 底部工具栏 | 显示 / 隐藏左侧图表面板 |
| 自转 | 底部工具栏 | 开启 / 关闭地球自动旋转 |
| 主题 | 顶部右侧「暖色 / 冷色」 | 切换界面配色 |

> 底部工具栏与右上角时间均可拖拽调整位置。

---

## 📡 数据接口（Mock）

由 `mock.js` + `json-server` 提供，全部基于 `GIS_DATA/` 下的 GeoJSON：

| 接口 | 数据内容 |
| --- | --- |
| `/Jinan_builds` | 济南建筑面数据 |
| `/Jinan_roads` | 济南道路线数据 |
| `/Jinan_livepoints` | 济南生活设施点 |
| `/Jinan_line` | 济南线状要素 |
| `/Jinan_lpointc` | 济南点状要素 |
| `/Jinan_highline` | 济南等高线 |
| `/Jinan_bus_lines` | 济南公交线路 |
| `/Jinan_bus_stops` | 济南公交站点 |
| `/Jinan_metro_stations` | 济南地铁站点 |

第三方接口（经 Vite 代理，配置于 `vite.config.js`）：

- `/amap/v3/direction/transit/integrated` —— 高德公交路线规划
- `/amap/v3/weather/weatherInfo` —— 高德实时天气

---

## 🔧 常见问题

**Q1：页面打开后地图是空白？**
检查 `.env` 中的 `VITE_TOKEN` 是否已配置且有效，Mapbox 底图依赖该 Token。

**Q2：地图上的公交、地铁等图层不显示？**
确认 Mock 服务已启动（终端运行 `npm run mock`），且 8080 端口未被占用。可访问 `http://localhost:8080/Jinan_bus_stops` 验证。

**Q3：公交路线规划 / 天气提示失败？**
这两个功能调用高德 WebService API，需要网络可达 `restapi.amap.com`；若提示跨域，请确认通过 Vite 代理访问（代码中使用 `/amap/...` 前缀）。

**Q4：端口被占用怎么办？**
可在 `package.json` 的 `mock` 脚本中修改 `-p` 端口，或在 `vite.config.js` 的 `server.port` 修改前端端口。

---

## 📦 构建部署

```bash
# 构建生产包
npm run build

# 本地预览构建产物
npm run preview
```

构建产物在 `dist/` 目录，可部署到任意静态服务器（Nginx、OSS、Gitee Pages 等）。注意：生产环境仍需同时部署 Mock 数据服务，或将 `GIS_DATA` 数据接入正式后端。

---

## 📜 说明

- 项目为教学 / 课程设计演示用途，出行人口、公交在线等统计图表数据为演示用 Mock 数据。
- GIS 地理数据仅用于学习展示。
- 高德 Key 在源码中硬编码，若遇到调用异常或配额超限，请前往[高德开放平台](https://lbs.amap.com/)重新申请 Key 并替换 `BottomTools.vue` 中的对应值。

---

## 📝 更新记录

- 2026-09-17：完善功能使用说明与数据接口文档，梳理项目结构与快速启动步骤。
