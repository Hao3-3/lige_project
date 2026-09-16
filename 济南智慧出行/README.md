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
