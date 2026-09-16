// 统计数据接口（艾合太木江 负责）
// 需求：统计公交、地铁、路口数量，返回给前端图表（src/views/G2chart.vue）
const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

router.get('/statistics', async (req, res) => {
  try {
    const pool = await getPool();
    const bus = await pool.request().query("SELECT COUNT(*) AS cnt FROM dbo.stations WHERE type = 'bus'");
    const metro = await pool.request().query("SELECT COUNT(*) AS cnt FROM dbo.stations WHERE type = 'metro'");

    // 路口数量（roads 表由李宏亮设计，未建表时容错返回 0）
    let roadCount = 0;
    try {
      const road = await pool.request().query('SELECT COUNT(*) AS cnt FROM dbo.roads');
      roadCount = road.recordset[0].cnt;
    } catch (e) { /* 表尚未创建，忽略 */ }

    res.json({
      code: 0,
      data: {
        bus_stations: bus.recordset[0].cnt,
        metro_stations: metro.recordset[0].cnt,
        road_intersections: roadCount,
      },
    });
  } catch (e) {
    console.error('statistics error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

module.exports = router;
