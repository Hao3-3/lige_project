// 地铁线路 & 站点接口（孙洪泳 负责）
// 需求：获取全部地铁线路；获取地铁站点；查询换乘站点信息
const express = require('express');
const { sql, getPool } = require('../db');

const router = express.Router();

// 获取全部地铁线路
router.get('/metro/lines', async (req, res) => {
  try {
    const pool = await getPool();
    // TODO: 依赖李宏亮设计的 metro_lines 表，字段以最终表结构为准
    const r = await pool.request().query('SELECT * FROM dbo.metro_lines ORDER BY id');
    res.json({ code: 0, data: r.recordset });
  } catch (e) {
    console.error('metro lines error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 获取全部地铁站点
router.get('/metro/stations', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool
      .request()
      .query("SELECT id, objectid, name, lng, lat, area FROM dbo.stations WHERE type = 'metro' ORDER BY id");
    res.json({ code: 0, data: r.recordset });
  } catch (e) {
    console.error('metro stations error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 查询换乘站点信息
router.get('/metro/transfer', async (req, res) => {
  const { name } = req.query;
  try {
    if (!name) return res.json({ code: 1, msg: '请输入站点名称' });
    const pool = await getPool();
    // TODO: 换乘信息依赖「线路-站点」关联表（由李宏亮设计），此处先返回匹配的地铁站
    const r = await pool
      .request()
      .input('n', sql.NVarChar, '%' + name + '%')
      .query("SELECT id, name, lng, lat FROM dbo.stations WHERE type = 'metro' AND name LIKE @n");
    res.json({ code: 0, data: r.recordset });
  } catch (e) {
    console.error('metro transfer error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

module.exports = router;
