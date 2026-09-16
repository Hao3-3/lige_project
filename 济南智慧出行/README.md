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
