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
