// 道路路口接口（孙洪泳 负责）
// 需求：查询路口数据
const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

// 查询路口数据
router.get('/roads', async (req, res) => {
  try {
    const pool = await getPool();
    // TODO: 依赖李宏亮设计的 roads 路口表，字段以最终表结构为准
    const r = await pool.request().query('SELECT * FROM dbo.roads ORDER BY id');
    res.json({ code: 0, data: r.recordset });
  } catch (e) {
    console.error('roads error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

module.exports = router;
