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
