// 交通事件模块：查询 / 上报 / 删除（事故 / 施工 / 拥堵 / 管制）
const express = require('express');
const { sql, getPool } = require('../db');

const router = express.Router();

// 查询事件列表（最新在前）
router.get('/events', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool
      .request()
      .query('SELECT id, type, level, lng, lat, address, description, username, created_at FROM dbo.events ORDER BY id DESC');
    res.json({ code: 0, data: r.recordset });
  } catch (e) {
    console.error('events list error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 上报事件
router.post('/events', async (req, res) => {
  const { type, level, lng, lat, address, description, username } = req.body || {};
  try {
    if (!type || lng == null || lat == null) {
      return res.json({ code: 1, msg: '事件类型和坐标不能为空' });
    }
    const allowType = ['accident', 'construction', 'congestion', 'control'];
    if (!allowType.includes(type)) return res.json({ code: 1, msg: '事件类型非法' });
    const pool = await getPool();
    const r = await pool
      .request()
      .input('type', sql.NVarChar, type)
      .input('level', sql.Int, Number(level) || 2)
      .input('lng', sql.Float, Number(lng))
      .input('lat', sql.Float, Number(lat))
      .input('address', sql.NVarChar, address || '')
      .input('description', sql.NVarChar, description || '')
      .input('username', sql.NVarChar, username || '匿名用户')
      .query(`INSERT INTO dbo.events (type, level, lng, lat, address, description, username)
              OUTPUT INSERTED.id
              VALUES (@type, @level, @lng, @lat, @address, @description, @username)`);
    res.json({ code: 0, msg: '事件上报成功', id: r.recordset[0].id });
  } catch (e) {
    console.error('events add error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 删除事件
router.delete('/events/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .query('DELETE FROM dbo.events WHERE id = @id');
    res.json({ code: 0, msg: '已删除' });
  } catch (e) {
    console.error('events delete error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

module.exports = router;
