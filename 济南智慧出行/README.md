# 泉城（济南）智慧出行

一个基于 **Vue3 + Vite + AntV L7 + Mapbox** 的智慧出行地图可视化平台，后端使用 **Express + SQL Server**。以济南市为核心，整合公交 / 地铁路网、实时公交模拟、出行路线规划、POI 周边检索、交通事件上报等功能，构建"一张图看懂城市出行"的可视化大屏。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端框架 | Vue 3（`<script setup>`）+ Vite 4 |
| 地图引擎 | Mapbox GL + AntV L7 / L7-Draw |
| UI 组件 | Element Plus |
| 图表 | AntV G2 / G2Plot |
| 状态 / 路由 | Pinia + Vue Router |
| 后端 | Express（Node.js） |
| 数据库 | SQL Server（本地 `jncity` 库） |
| 在线接口 | 高德 WebService（路线规划 / 周边检索 / 路况 / 地理编码） |

## 功能特性

- **登录 / 注册**：图形验证码注册，登录后进入主界面
- **地图底图与图层**：Mapbox 底图 + 本地 GeoJSON 图层（公交 / 地铁路网、站点、区县、等高线、建筑、道路）
- **实时公交模拟**：公交线路与站点动态展示
- **路线规划**：起终点出行路径规划（高德在线）
- **POI 周边检索**：按关键词检索周边兴趣点（高德在线）
- **实时路况**：路况图层叠加展示
- **交通事件上报**：事件上报、收藏、历史记录、公告、班次等后端接口
- **数据可视化**：图表看板（AntV G2）

## 项目结构

```
├── src/                    # 前端源码
│   ├── components/         # 组件（BottomTools.vue 为地图主功能）
│   ├── views/              # 页面（登录、首页、图表）
│   ├── Hooks/              # 地图 / 公交 / 人口等逻辑 Hook
│   └── router/             # 路由配置
├── server/                 # Express 后端与数据库脚本
│   ├── index.js            # 后端入口（localhost:3000）
│   ├── db.js               # 数据库连接配置（需改 sa 密码）
│   └── init*.js / schema.sql  # 建库建表与数据导入
├── GIS_DATA/               # 本地公交 / 地铁 / 区县等 GeoJSON 数据（不可删）
├── jncity.sql              # 数据库参考脚本
├── 一键启动.bat             # Windows 一键启动
├── 初始化数据库.bat         # 首次初始化数据库
└── 运行说明.md              # 详细运行说明
```

## 快速开始

详细步骤见 **[运行说明.md](运行说明.md)**，简要流程如下：

### 环境要求

- Node.js 18+
- SQL Server（监听 1433，启用 `sa` 账号）
- 联网（Mapbox 底图 + 高德接口）

### 启动步骤

1. 修改 `server/db.js` 中的 `password` 为你的 `sa` 密码
2. 双击 `初始化数据库.bat`（首次，自动创建 `jncity` 库和各表）
3. 双击 `一键启动.bat`，自动打开 `http://localhost:5173`
4. 首次在登录页点「注册」创建账号后登录

等价的手动命令：

```bash
npm install          # 根目录前端依赖
cd server && npm install && cd ..   # 后端依赖

npm run initdb       # 初始化数据库（首次）
npm run initextra
npm run initevents

npm run dev          # 启动（vite 自动拉起后端 Express）
```

## 功能依赖关系

| 功能 | 需 SQL Server | 需联网 |
| --- | --- | --- |
| 登录 / 注册 / 验证码 | 是 | 否 |
| 事件上报、收藏、历史、公告、班次 | 是 | 否 |
| 公交 / 地铁路网、实时公交、等高线、区县 | 否（读本地 GIS_DATA） | 否 |
| 路线规划、周边检索、路况、地理编码 | 否 | 是（高德） |
| 地图底图 | 否 | 是（Mapbox，token 在 `.env`） |

## 注意事项

- **`.env` 文件**（含 Mapbox token）已被 `.gitignore` 排除，不会上传。clone 后请复制 `.env.example` 为 `.env` 并填入自己的 `VITE_TOKEN`。
- `node_modules`、`dist`、`server/node_modules` 等依赖目录已排除，clone 后执行 `npm install` 即可。
- 不要直接双击 `index.html` 或只部署 `dist`：生产静态包缺少 `/amap`、`/api` 代理，功能会缺失。请用源码 + `npm run dev` 运行。
- 高德接口通过 vite 的 `/amap` 代理转发，仅在 `npm run dev` 下有效。
