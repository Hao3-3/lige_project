// 后端入口：只负责启动与路由挂载，业务逻辑按模块拆分到 ./routes/*
// 分工：
//   auth.js        验证码/注册/登录/登录态（邵智昊 辅助，对接前端登录）
//   bus.js         公交站点（孙洪泳）
//   metro.js       地铁线路/站点/换乘（孙洪泳）
//   road.js        道路路口（孙洪泳）
//   navigation.js  导航路径规划（艾合太木江）
//   statistics.js  数据统计（艾合太木江）
//   events.js      交通事件上报（艾合太木江）
//   schedule.js    班次/公告/实时到站（郭津铭）
//   collect.js     收藏与搜索历史（郭津铭）
const express = require('express');
const cors = require('cors');
const { getPool } = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 统一挂载各模块路由（前缀 /api）
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/bus'));
app.use('/api', require('./routes/metro'));
app.use('/api', require('./routes/road'));
app.use('/api', require('./routes/navigation'));
app.use('/api', require('./routes/statistics'));
app.use('/api', require('./routes/events'));
app.use('/api', require('./routes/schedule'));
app.use('/api', require('./routes/collect'));

// 健康检查
app.get('/api/health', (req, res) => res.json({ code: 0, msg: 'ok' }));

// 启动：先连数据库，成功后再监听端口
getPool()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 后端已启动: http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('❌ 数据库连接失败：', e.message);
    process.exit(1);
  });
