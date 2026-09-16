// 导航辅助接口（艾合太木江 负责）
// 需求：接收起点/终点，查询路网返回路径点位；也可调用第三方地图 API（高德）
const express = require('express');

const router = express.Router();

// 路线规划：origin / dest 为 { lng, lat }
router.post('/navigation/route', (req, res) => {
  const { origin, dest } = req.body || {};
  try {
    if (!origin || !dest) return res.json({ code: 1, msg: '起点和终点不能为空' });
    // TODO(艾合太木江)：实现路径规划，二选一：
    //   1) 本地路网：查询 dbo.roads（李宏亮建表）做最短路径/导航
    //   2) 调用高德 API direction 接口（key 建议放 .env，通过后端转发避免跨域）
    res.json({ code: 0, data: { origin, dest, path: [] } });
  } catch (e) {
    console.error('navigation error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

module.exports = router;
