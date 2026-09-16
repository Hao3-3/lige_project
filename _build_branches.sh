#!/bin/bash
set -e
cd "$(dirname "$0")/济南智慧出行"

build() {
  local branch="$1"; shift
  git checkout -q -B "$branch" main
  git rm -r -q .
  git checkout -q main -- "$@"
}

# ======================================================================
# 1. 邵智昊 —— 前端 地图基础
# ======================================================================
build shaozhihao-map-base \
  .gitignore .env.example \
  src/composables/useMapBase.js src/composables/useShared.js \
  src/Hooks/coord.js \
  GIS_DATA/Jinan_line.json GIS_DATA/Jinan_highline.json GIS_DATA/Jinan_livepoints.json \
  GIS_DATA/Jinan_bus_stops.json GIS_DATA/Jinan_metro_stations.json \
  server/routes/auth.js

cat > README.md <<'EOF'
# 济南智慧出行 · 组员任务分支

## 👤 邵智昊 —— 前端「地图基础」模块

> ⚠️ 本分支只包含**该组员任务所需代码**，不含完整项目；完整可运行版本在 `main` 分支。

## 本分支文件清单（我负责的部分）

| 文件 | 说明 |
| --- | --- |
| `src/composables/useMapBase.js` | 地图基础交互：自转 / 飞行济南 / 底部拖动 / 图层控制面板 / 县区规划 / 等高线 / 天气 / 线路悬停弹窗 |
| `src/composables/useShared.js` | 公共骨架（跨模块单例 + 工具函数 + 公告 + 收藏/历史），**所有前端模块共用** |
| `src/Hooks/coord.js` | 坐标转换工具（WGS84 ↔ GCJ02） |
| `server/routes/auth.js` | 登录 / 注册 / 图形验证码接口（辅助） |
| `GIS_DATA/Jinan_line.json` 等 | 区县边界、等高线、事件点、公交/地铁站点数据 |

## 详细任务

见 [`docs/任务-邵智昊.md`](docs/任务-邵智昊.md)。

## 运行说明

- 本分支是**模块代码 + 最小依赖**，需配合 `main` 分支（含 `BottomTools.vue` 集成入口与其余模块）才能整体运行。
- 完整启动步骤见 `main` 分支的 `README.md` / `运行说明.md`。

## 依赖其他组员

- 郭津铭：公交模块（`useBus.js`）
- 比拉力：地铁模块（`useMetro.js`）
- 艾合太木江：出行工具模块（`useTransit.js`）
EOF

mkdir -p docs
cat > "docs/任务-邵智昊.md" <<'EOF'
# 邵智昊 —— 地图基础模块（前端）

> 负责地图底图加载与基础交互能力，是整张地图大屏的地基。

## 任务清单

- [ ] **底图加载**：Mapbox 底图初始化，token 从根目录 `.env`（`VITE_TOKEN`）读取，用 AntV L7 `Scene` 创建场景
- [ ] **底图切换**：支持多套底图主题切换（`src/assets/themes/` 下已有 dark / light / navigation-day / navigation-night / outdoors / satellite / streets 等主题预览图）
- [ ] **基础交互**：缩放、平移、旋转、飞行定位
- [ ] **测距工具**：两点/多点测距（参考 `src/components/DrawTool.vue`）
- [ ] **面积量算**：多边形面积量算（同 `DrawTool.vue`）
- [ ] **全屏 / 定位**：浏览器 Geolocation 获取当前位置并打点
- [ ] **基础图层加载**：等高线（`Jinan_highline.json`）、区县边界（`Jinan_line.json`）、事件点（`Jinan_livepoints.json`）
- [ ] **图层开关控制**：图层控制面板中加各图层显隐开关
- [ ] **县区规划**：点击区县查询该区县内事件点
- [ ] **线路通用交互**：公交/地铁线路的悬停、点击弹窗（人流量/通行时间）

## 本分支文件（重构后）

- `src/composables/useMapBase.js` —— **你的核心模块**（地图基础交互全部逻辑）
- `src/composables/useShared.js` —— 公共骨架（单例 `ctx` + 工具 + 公告 + 收藏/历史）
- `src/Hooks/coord.js` —— 坐标转换
- `server/routes/auth.js` —— 登录/注册/验证码接口（辅助）
- `GIS_DATA/` —— 区县 / 等高线 / 事件点 / 站点数据

> 重构说明：原 `src/components/BottomTools.vue`（约 3700 行单体）已按模块拆分为 `src/composables/` 下的多个 Hook，最终在 `main` 分支的 `BottomTools.vue` 中集成。

## 依赖

- 后端 / 数据库：无（登录接口见 `server/routes/auth.js`）
- 联网：是（Mapbox 底图需联网，token 在 `.env`）

## 注意

- 高德接口通过 vite `/amap` 代理，仅在 `npm run dev` 下有效
- `.env` 已被 gitignore，本地需自己复制 `.env.example` 为 `.env` 并填入 token
EOF
git add -A
git commit -q -m "按组员任务分发：邵智昊（前端-地图基础）"
git push -f origin shaozhihao-map-base 2>&1 | tail -1

# ======================================================================
# 2. 郭津铭 —— 前端 公交站点
# ======================================================================
build guojinming-bus-station \
  .gitignore .env.example \
  src/composables/useBus.js src/composables/useShared.js \
  src/Hooks/busOnline.js \
  GIS_DATA/Jinan_bus_stops.json GIS_DATA/Jinan_bus_lines.json GIS_DATA/Jinan_metro_stations.json \
  server/routes/schedule.js server/routes/collect.js

cat > README.md <<'EOF'
# 济南智慧出行 · 组员任务分支

## 👤 郭津铭 —— 前端「公交站点」模块（含班次 / 收藏接口）

> ⚠️ 本分支只包含**该组员任务所需代码**，不含完整项目；完整可运行版本在 `main` 分支。

## 本分支文件清单（我负责的部分）

| 文件 | 说明 |
| --- | --- |
| `src/composables/useBus.js` | 公交站点 / 线路渲染、实时公交模拟、到站预测、班次查询 |
| `src/composables/useShared.js` | 公共骨架（跨模块单例 + 工具函数 + 公告 + 收藏/历史） |
| `src/Hooks/busOnline.js` | 实时公交在线模拟逻辑 |
| `server/routes/schedule.js` | 班次 / 公告 / 实时到站接口 |
| `server/routes/collect.js` | 收藏与搜索历史接口 |
| `GIS_DATA/Jinan_bus_stops.json`、`Jinan_bus_lines.json` | 公交站点 / 线路数据 |

## 详细任务

见 [`docs/任务-郭津铭.md`](docs/任务-郭津铭.md)。

## 运行说明

- 本分支是**模块代码 + 最小依赖**，需配合 `main` 分支才能整体运行。
- 完整启动步骤见 `main` 分支的 `README.md` / `运行说明.md`。

## 依赖其他组员

- 邵智昊：地图基础（`useMapBase.js`）
- 孙洪泳：公交站点后端接口
- 李宏亮：公交站点 / 线路数据库表
EOF

mkdir -p docs
cat > "docs/任务-郭津铭.md" <<'EOF'
# 郭津铭 —— 公交站点管理模块（前端）

> 负责济南市公交站点与线路的渲染、查询与实时模拟。

## 任务清单

- [ ] 在地图渲染济南市全部公交站点（点要素，数据 `GIS_DATA/Jinan_bus_stops.json`）
- [ ] 点击站点弹窗：显示站点名称 + 途经公交线路（关联 `GIS_DATA/Jinan_bus_lines.json`）
- [ ] 站点查询：输入站点名模糊搜索，地图定位跳转过去
- [ ] 公交线路线要素渲染（`Jinan_bus_lines.json`），点击线路高亮
- [ ] 实时公交模拟：公交沿线路动态移动展示（参考 `src/Hooks/busOnline.js`）
- [ ] 到站预测：点击站点查看下一班到站时间与拥挤度
- [ ] 班次时刻表查询
- [ ] 站点 / 线路图层显隐开关（图层控制面板）
- [ ] 班次 / 公告 / 实时到站接口（`server/routes/schedule.js`）
- [ ] 收藏与搜索历史接口（`server/routes/collect.js`）

## 本分支文件（重构后）

- `src/composables/useBus.js` —— **你的核心模块**（公交站点/线路/实时公交/到站预测/班次）
- `src/composables/useShared.js` —— 公共骨架
- `src/Hooks/busOnline.js` —— 实时公交模拟逻辑
- `server/routes/schedule.js`、`server/routes/collect.js` —— 班次/收藏后端接口
- `GIS_DATA/Jinan_bus_stops.json`、`Jinan_bus_lines.json`

> 重构说明：原单体 `BottomTools.vue` 中的公交逻辑已抽到 `useBus.js`，最终在 `main` 分支的 `BottomTools.vue` 集成。

## 依赖

- 后端接口：孙洪泳提供的公交站点接口（获取全部站点 / 模糊搜索 / 按 id 查详情）
- 数据库：李宏亮的公交站点、线路表

## 注意

- 站点弹窗的「途经线路」可通过站点 id 关联线路数据实现
EOF
git add -A
git commit -q -m "按组员任务分发：郭津铭（前端-公交站点）"
git push -f origin guojinming-bus-station 2>&1 | tail -1

# ======================================================================
# 3. 比拉力 —— 前端 地铁线路
# ======================================================================
build bilali-metro \
  .gitignore .env.example \
  src/composables/useMetro.js src/composables/useShared.js \
  GIS_DATA/Jinan_metro_lines.json GIS_DATA/Jinan_metro_stations.json GIS_DATA/Jinan_bus_stops.json

cat > README.md <<'EOF'
# 济南智慧出行 · 组员任务分支

## 👤 比拉力 —— 前端「地铁线路」模块

> ⚠️ 本分支只包含**该组员任务所需代码**，不含完整项目；完整可运行版本在 `main` 分支。

## 本分支文件清单（我负责的部分）

| 文件 | 说明 |
| --- | --- |
| `src/composables/useMetro.js` | 地铁线路 / 站点渲染、发光置顶、图层显隐 |
| `src/composables/useShared.js` | 公共骨架（跨模块单例 + 工具函数 + 公告 + 收藏/历史） |
| `GIS_DATA/Jinan_metro_lines.json`、`Jinan_metro_stations.json` | 地铁线路 / 站点数据 |

## 详细任务

见 [`docs/任务-比拉力.md`](docs/任务-比拉力.md)。

## 运行说明

- 本分支是**模块代码 + 最小依赖**，需配合 `main` 分支才能整体运行。
- 完整启动步骤见 `main` 分支的 `README.md` / `运行说明.md`。

## 依赖其他组员

- 邵智昊：地图基础（`useMapBase.js`）
- 孙洪泳：地铁线路 / 站点后端接口
- 李宏亮：地铁线路 / 站点数据库表
EOF

mkdir -p docs
cat > "docs/任务-比拉力.md" <<'EOF'
# 比拉力 —— 地铁线路模块（前端）

> 负责济南市地铁线路与站点的渲染、弹窗与筛选。

## 任务清单

- [ ] 地铁线路线要素渲染（`GIS_DATA/Jinan_metro_lines.json`）
- [ ] 地铁站点点要素渲染（`GIS_DATA/Jinan_metro_stations.json`）
- [ ] 点击地铁站点弹窗：显示换乘信息 + 首末班时间
- [ ] 地铁线路筛选：复选框勾选某条线，显示 / 隐藏该地铁线
- [ ] 地铁线路发光 + 置顶效果
- [ ] 地铁与公交站点的换乘关联展示
- [ ] 线路配色与图例
- [ ] 地铁线路 / 站点图层显隐开关（图层控制面板）

## 本分支文件（重构后）

- `src/composables/useMetro.js` —— **你的核心模块**（地铁线路/站点渲染、发光置顶、显隐）
- `src/composables/useShared.js` —— 公共骨架（含 `buildLinesGeoJSON` 线路几何生成）
- `GIS_DATA/Jinan_metro_lines.json`、`Jinan_metro_stations.json`

> 重构说明：原单体 `BottomTools.vue` 中的地铁逻辑已抽到 `useMetro.js`，最终在 `main` 分支的 `BottomTools.vue` 集成。

## 依赖

- 后端接口：孙洪泳的地铁线路 & 站点接口、换乘站点信息
- 数据库：李宏亮的地铁线路 / 站点表

## 注意

- 首末班时间、换乘信息需后端 / 数据库提供对应字段
EOF
git add -A
git commit -q -m "按组员任务分发：比拉力（前端-地铁线路）"
git push -f origin bilali-metro 2>&1 | tail -1

# ======================================================================
# 4. 孙洪泳 —— 后端 API
# ======================================================================
build sunhongyong-backend-api \
  .gitignore .env.example \
  server/index.js server/db.js server/package.json server/package-lock.json server/schema.sql \
  server/routes/auth.js server/routes/bus.js server/routes/metro.js server/routes/road.js \
  server/routes/events.js server/routes/schedule.js server/routes/collect.js

cat > README.md <<'EOF'
# 济南智慧出行 · 组员任务分支

## 👤 孙洪泳 —— 后端「公交 / 地铁 / 路口」API 接口

> ⚠️ 本分支只包含**该组员任务所需代码**（后端），不含前端；完整项目在 `main` 分支。

## 本分支文件清单（我负责的部分）

| 文件 | 说明 |
| --- | --- |
| `server/routes/bus.js` | 公交站点接口：全部站点 / 模糊搜索 / 按 id 查详情 |
| `server/routes/metro.js` | 地铁线路 / 站点 / 换乘接口 |
| `server/routes/road.js` | 道路路口接口 |
| `server/db.js` | SQL Server 连接配置（需改 sa 密码） |
| `server/index.js` | Express 入口（统一挂载各模块路由，前缀 `/api`） |

> 其余 `server/routes/` 下路由（auth / events / schedule / collect / navigation / statistics）由其他组员负责，此处一并提供以保证后端可整体运行。

## 详细任务

见 [`docs/任务-孙洪泳.md`](docs/任务-孙洪泳.md)。

## 运行说明

```bash
cd server
npm install
node index.js        # 后端监听 http://localhost:3000
```

## 依赖其他组员

- 李宏亮：公交站点 / 线路、地铁线路 / 站点、路口表结构
EOF

mkdir -p docs
cat > "docs/任务-孙洪泳.md" <<'EOF'
# 孙洪泳 —— 后端 API 接口

> 读取数据库，给 Vue 前端提供公交 / 地铁 / 路口等查询接口。

## 任务清单

- [ ] **公交站点接口**：获取全部公交站点；按名称模糊搜索；按 id 查详情
- [ ] **地铁线路 & 站点接口**：获取全部地铁线路；获取地铁站点；查询换乘站点信息
- [ ] **道路路口接口**：查询路口数据
- [ ] 统一返回格式 `{ code, msg, data }`，与现有接口保持一致
- [ ] 保持与现有登录 / 注册 / 事件等接口不冲突（`server/index.js` 已实现挂载）

## 本分支文件（重构后）

- `server/routes/bus.js` —— **你的核心模块**（公交站点接口）
- `server/routes/metro.js` —— 地铁线路/站点/换乘接口
- `server/routes/road.js` —— 道路路口接口
- `server/db.js` —— 数据库连接（`{ sql, config, getPool }`）
- `server/index.js` —— Express 入口（路由统一挂载在 `/api`）

> 重构说明：原 `server/index.js` 单文件已拆分为 `server/routes/*` 多个模块，`index.js` 只负责启动与挂载。

## ⚠️ 重要

- **项目实际用的是 SQL Server，不是 MySQL**（分工文档写的是 MySQL，以代码为准）
- 数据库连接在 `server/db.js`，默认 `sa` 账号，端口 1433

## 依赖

- 数据库：李宏亮设计的表结构（公交站点 / 线路、地铁线路 / 站点、路口）

## 注意

- 前端通过 vite 的 `/api` 代理转发到 `localhost:3000`
EOF
git add -A
git commit -q -m "按组员任务分发：孙洪泳（后端-公交/地铁/路口API）"
git push -f origin sunhongyong-backend-api 2>&1 | tail -1

# ======================================================================
# 5. 艾合太木江 —— 后端 导航/统计 + 前端 出行工具
# ======================================================================
build aihetaimujiang-navigation \
  .gitignore .env.example \
  server/index.js server/db.js server/package.json server/package-lock.json server/schema.sql \
  server/routes/auth.js server/routes/bus.js server/routes/metro.js server/routes/road.js \
  server/routes/navigation.js server/routes/statistics.js server/routes/events.js \
  server/routes/schedule.js server/routes/collect.js \
  src/composables/useTransit.js src/composables/useShared.js \
  src/Hooks/coord.js \
  GIS_DATA/Jinan_bus_stops.json GIS_DATA/Jinan_metro_stations.json

cat > README.md <<'EOF'
# 济南智慧出行 · 组员任务分支

## 👤 艾合太木江 —— 后端「导航 / 统计」+ 前端「出行工具」模块

> ⚠️ 本分支只包含**该组员任务所需代码**，不含完整项目；完整项目在 `main` 分支。

## 本分支文件清单（我负责的部分）

| 文件 | 说明 |
| --- | --- |
| `server/routes/navigation.js` | 导航路径规划接口（可走高德 API） |
| `server/routes/statistics.js` | 统计接口（公交/地铁站点数、路口数） |
| `server/routes/events.js` | 交通事件上报 / 列表接口 |
| `src/composables/useTransit.js` | 前端出行工具：路线规划 / 车道级导航 / 实时路况 / 事件上报 / POI 周边检索 |
| `src/composables/useShared.js` | 公共骨架 |
| `src/Hooks/coord.js` | 坐标转换（WGS84 ↔ GCJ02） |

> 其余 `server/routes/` 下路由由其他组员负责，此处一并提供以保证后端可整体运行。

## 详细任务

见 [`docs/任务-艾合太木江.md`](docs/任务-艾合太木江.md)。

## 运行说明

```bash
cd server
npm install
node index.js        # 后端监听 http://localhost:3000
```

## 依赖其他组员

- 邵智昊：地图基础（`useMapBase.js`）
- 李宏亮：路口表、统计所需数据
- 高德 WebService API（联网）
EOF

mkdir -p docs
cat > "docs/任务-艾合太木江.md" <<'EOF'
# 艾合太木江 —— 导航辅助 + 统计接口（后端）+ 出行工具（前端）

> 负责路径规划辅助接口、统计数据接口，以及前端出行工具（路线规划 / 路况 / 事件 / POI）。

## 任务清单

- [ ] **导航辅助接口**：接收起点 / 终点，查询路网返回路径点位；可调用高德地图 API 做路线规划
- [ ] **统计数据接口**：统计公交（线路 / 站点数）、地铁（线路 / 站点数）、路口数量，返回给前端图表
- [ ] 与前端图表 `src/views/G2chart.vue` 对接数据格式
- [ ] **交通事件接口**：事件上报 / 事件列表（`server/routes/events.js`）
- [ ] **前端出行工具**：公交 / 驾车 / 步行路线规划（多备选方案）、车道级导航、实时路况图层、POI 周边检索
- [ ] 可选：POI 周边检索接口（项目有 POI 周边检索功能，走高德在线）

## 本分支文件（重构后）

- `server/routes/navigation.js` —— **核心**（导航路径规划接口）
- `server/routes/statistics.js` —— 统计接口
- `server/routes/events.js` —— 事件上报/列表接口
- `src/composables/useTransit.js` —— **核心前端**（路线规划/车道级导航/路况/事件/POI）
- `src/composables/useShared.js` —— 公共骨架
- `src/Hooks/coord.js` —— 坐标转换

> 重构说明：原单体 `BottomTools.vue` 中的出行/路况/事件/POI 逻辑已抽到 `useTransit.js`。

## 依赖

- 高德 WebService API（路线规划 / 周边检索 / 路况 / 地理编码，需联网）
- 数据库：李宏亮的路口表、统计所需数据

## 注意

- 高德接口在本地开发时通过 vite `/amap` 代理转发，避免浏览器直接访问 restapi.amap.com 被干扰
EOF
git add -A
git commit -q -m "按组员任务分发：艾合太木江（后端-导航/统计 + 前端-出行工具）"
git push -f origin aihetaimujiang-navigation 2>&1 | tail -1

# ======================================================================
# 6. 李宏亮 —— 数据库
# ======================================================================
build lihongliang-database \
  .gitignore .env.example \
  server/db.js server/schema.sql server/package.json server/package-lock.json \
  server/init.js server/initExtra.js server/initEvents.js \
  server/importBusLines.js server/importStations.js server/exportDb.js \
  jncity.sql \
  GIS_DATA/Jinan_builds.json GIS_DATA/Jinan_bus_lines.json GIS_DATA/Jinan_bus_stops.json \
  GIS_DATA/Jinan_highline.json GIS_DATA/Jinan_line.json GIS_DATA/Jinan_livepoints.json \
  GIS_DATA/Jinan_lpointc.json GIS_DATA/Jinan_metro_lines.json GIS_DATA/Jinan_metro_stations.json \
  GIS_DATA/Jinan_roads.json

cat > README.md <<'EOF'
# 济南智慧出行 · 组员任务分支

## 👤 李宏亮 —— 数据库设计

> ⚠️ 本分支只包含**该组员任务所需代码**（数据库），不含前端/后端业务；完整项目在 `main` 分支。

## 本分支文件清单（我负责的部分）

| 文件 | 说明 |
| --- | --- |
| `server/db.js` | SQL Server 连接配置（`{ sql, config, getPool }`） |
| `server/schema.sql` | 建表参考脚本 |
| `jncity.sql` | 数据库参考脚本 |
| `server/init.js` / `initExtra.js` / `initEvents.js` | 建库建表 / 扩展表 / 事件表初始化 |
| `server/importBusLines.js` / `importStations.js` | 公交线路 / 站点数据导入 |
| `server/exportDb.js` | 数据库导出脚本 |
| `GIS_DATA/` | 济南公交 / 地铁 / 区县 / 道路等 GeoJSON 数据（导入来源） |

## 详细任务

见 [`docs/任务-李宏亮.md`](docs/任务-李宏亮.md)。

## 运行说明

```bash
cd server
npm install
node init.js         # 建库建表（首次）
node initExtra.js
node initEvents.js
node importStations.js   # 导入站点数据
node importBusLines.js   # 导入线路数据
```

## 依赖其他组员

- 无（孙洪泳、艾合太木江的后端接口依赖你的表结构）
EOF

mkdir -p docs
cat > "docs/任务-李宏亮.md" <<'EOF'
# 李宏亮 —— 数据库设计

> 负责数据库表结构设计、数据导入与查询语句。

## 任务清单

- [ ] **表结构设计**：公交站点、公交线路、地铁线路、地铁站点、路口、用户、事件、收藏、历史、公告、班次等表
- [ ] 创建全部数据表（建表脚本）
- [ ] 导入济南公交、地铁、路口数据
- [ ] 站点查询等 SQL 语句
- [ ] 与后端接口字段对齐（孙洪泳、艾合太木江的接口依赖你的表结构）

## 本分支文件（重构后）

- `server/db.js` —— **核心**（数据库连接，`{ sql, config, getPool }`）
- `server/schema.sql`、`jncity.sql` —— 建表脚本
- `server/init.js`、`initExtra.js`、`initEvents.js` —— 初始化脚本
- `server/importBusLines.js`、`importStations.js` —— 数据导入
- `server/exportDb.js` —— 导出脚本
- `GIS_DATA/` —— 数据文件（公交 / 地铁 / 区县 / 道路 GeoJSON）

## ⚠️ 重要

- **项目实际用的是 SQL Server（jncity 库），不是 MySQL**（分工文档写的是 MySQL，以代码为准）
- 连接配置在 `server/db.js`，`sa` 账号，端口 1433

## 依赖

- 无（其他成员依赖你的表结构和数据）

## 注意

- 数据文件在 `GIS_DATA/`（济南公交 / 地铁 / 路口 GeoJSON）
EOF
git add -A
git commit -q -m "按组员任务分发：李宏亮（数据库）"
git push -f origin lihongliang-database 2>&1 | tail -1

# ======================================================================
# 收尾：回到 main
# ======================================================================
git checkout -q main
echo "✅ 全部分支已构建并推送完成"
