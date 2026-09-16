// 公交站点接口（孙洪泳 负责）
// 需求：获取全部公交站点；按名称模糊搜索；按 id 查详情（含途经线路）
const express = require('express');
const { sql, getPool } = require('../db');

const router = express.Router();

// 获取全部站点（兼容旧接口，type 区分 bus / metro）
router.get('/stations', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool
      .request()
      .query('SELECT id, objectid, name, lng, lat, area, type FROM dbo.stations ORDER BY type, id');
    res.json({ code: 0, data: r.recordset });
  } catch (e) {
    console.error('stations error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 获取全部公交站点
router.get('/bus/stations', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool
      .request()
      .query("SELECT id, objectid, name, lng, lat, area FROM dbo.stations WHERE type = 'bus' ORDER BY id");
    res.json({ code: 0, data: r.recordset });
  } catch (e) {
    console.error('bus stations error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 按名称模糊搜索公交站点
router.get('/bus/search', async (req, res) => {
  const { name } = req.query;
  try {
    if (!name) return res.json({ code: 1, msg: '请输入站点名称' });
    const pool = await getPool();
    const r = await pool
      .request()
      .input('n', sql.NVarChar, '%' + name + '%')
      .query("SELECT id, objectid, name, lng, lat, area FROM dbo.stations WHERE type = 'bus' AND name LIKE @n ORDER BY id");
    res.json({ code: 0, data: r.recordset });
  } catch (e) {
    console.error('bus search error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 按 id 查询公交站点详情（含途经线路）
router.get('/bus/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .query("SELECT id, objectid, name, lng, lat, area, type FROM dbo.stations WHERE id = @id AND type = 'bus'");
    if (!r.recordset.length) return res.json({ code: 1, msg: '站点不存在' });
    // TODO: 关联途经公交线路（依赖李宏亮设计的 bus_lines 表），返回途经线路列表
    res.json({ code: 0, data: r.recordset[0] });
  } catch (e) {
    console.error('bus detail error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

module.exports = router;
