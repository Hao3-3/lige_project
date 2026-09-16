// 收藏 + 搜索历史记录
const express = require('express');
const { sql, getPool } = require('../db');

const router = express.Router();

// ============================================================
// 收藏
// ============================================================
// 收藏列表
router.get('/favorites', async (req, res) => {
  const { username } = req.query;
  try {
    if (!username) return res.json({ code: 0, data: [] });
    const pool = await getPool();
    const r = await pool.request()
      .input('u', sql.NVarChar, username)
      .query('SELECT id, type, name, detail, created_at FROM dbo.favorites WHERE username = @u ORDER BY id DESC');
    res.json({ code: 0, data: r.recordset });
  } catch (e) {
    console.error('favorites list error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 添加收藏
router.post('/favorites', async (req, res) => {
  const { username, type, name, detail } = req.body || {};
  try {
    if (!username || !type || !name) return res.json({ code: 1, msg: '用户名、类型和名称不能为空' });
    const allowType = ['route', 'station'];
    if (!allowType.includes(type)) return res.json({ code: 1, msg: '收藏类型非法' });
    const pool = await getPool();
    // 去重：同一用户同类型同名称不重复添加
    const exists = await pool.request()
      .input('u', sql.NVarChar, username)
      .input('t', sql.NVarChar, type)
      .input('n', sql.NVarChar, name)
      .query('SELECT id FROM dbo.favorites WHERE username = @u AND type = @t AND name = @n');
    if (exists.recordset.length) return res.json({ code: 0, msg: '已收藏过', id: exists.recordset[0].id });
    const r = await pool.request()
      .input('u', sql.NVarChar, username)
      .input('t', sql.NVarChar, type)
      .input('n', sql.NVarChar, name)
      .input('d', sql.NVarChar, detail || '')
      .query(`INSERT INTO dbo.favorites (username, type, name, detail)
              OUTPUT INSERTED.id
              VALUES (@u, @t, @n, @d)`);
    res.json({ code: 0, msg: '收藏成功', id: r.recordset[0].id });
  } catch (e) {
    console.error('favorites add error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 删除收藏
router.delete('/favorites/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, Number(req.params.id))
      .query('DELETE FROM dbo.favorites WHERE id = @id');
    res.json({ code: 0, msg: '已取消收藏' });
  } catch (e) {
    console.error('favorites delete error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// ============================================================
// 搜索历史
// ============================================================
// 历史列表
router.get('/history', async (req, res) => {
  const { username } = req.query;
  try {
    if (!username) return res.json({ code: 0, data: [] });
    const pool = await getPool();
    const r = await pool.request()
      .input('u', sql.NVarChar, username)
      .query('SELECT TOP 20 id, type, query_text, detail, created_at FROM dbo.search_history WHERE username = @u ORDER BY id DESC');
    res.json({ code: 0, data: r.recordset });
  } catch (e) {
    console.error('history list error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 添加搜索历史
router.post('/history', async (req, res) => {
  const { username, type, query_text, detail } = req.body || {};
  try {
    if (!username || !type) return res.json({ code: 0, msg: '忽略' });
    const pool = await getPool();
    await pool.request()
      .input('u', sql.NVarChar, username)
      .input('t', sql.NVarChar, type)
      .input('q', sql.NVarChar, query_text || '')
      .input('d', sql.NVarChar, detail || '')
      .query(`INSERT INTO dbo.search_history (username, type, query_text, detail)
              VALUES (@u, @t, @q, @d)`);
    // 自动清理：每个用户只保留最近 50 条
    await pool.request()
      .input('u', sql.NVarChar, username)
      .query(`DELETE FROM dbo.search_history WHERE username = @u AND id NOT IN (
                SELECT TOP 50 id FROM dbo.search_history WHERE username = @u ORDER BY id DESC
              )`);
    res.json({ code: 0, msg: '已记录' });
  } catch (e) {
    console.error('history add error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 清空搜索历史
router.delete('/history', async (req, res) => {
  const { username } = req.query;
  try {
    if (!username) return res.json({ code: 1, msg: '用户名不能为空' });
    const pool = await getPool();
    await pool.request()
      .input('u', sql.NVarChar, username)
      .query('DELETE FROM dbo.search_history WHERE username = @u');
    res.json({ code: 0, msg: '历史已清空' });
  } catch (e) {
    console.error('history clear error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

module.exports = router;
