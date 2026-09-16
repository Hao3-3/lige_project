// 班次时刻表 + 公告通知 + 实时公交到站预测
const express = require('express');
const { sql, getPool } = require('../db');

const router = express.Router();

// ============================================================
// 班次时刻表
// ============================================================
router.get('/schedules', async (req, res) => {
  try {
    const pool = await getPool();
    const { line } = req.query;
    const r = await pool.request()
      .input('line', sql.NVarChar, line || null)
      .query(`
        SELECT id, line_name, direction, first_bus, last_bus, interval_min, interval_peak, note
        FROM dbo.schedules
        WHERE (@line IS NULL OR line_name LIKE '%' + @line + '%')
        ORDER BY line_name, direction
      `);
    res.json({ code: 0, data: r.recordset });
  } catch (e) {
    console.error('schedules error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// 管理员添加/修改班次
router.post('/schedules', async (req, res) => {
  const { line_name, direction, first_bus, last_bus, interval_min, interval_peak, note } = req.body || {};
  try {
    if (!line_name) return res.json({ code: 1, msg: '线路名不能为空' });
    const pool = await getPool();
    const r = await pool.request()
      .input('line_name', sql.NVarChar, line_name)
      .input('direction', sql.NVarChar, direction || '上行')
      .input('first_bus', sql.NVarChar, first_bus || '')
      .input('last_bus', sql.NVarChar, last_bus || '')
      .input('interval_min', sql.Int, Number(interval_min) || 8)
      .input('interval_peak', sql.Int, Number(interval_peak) || 5)
      .input('note', sql.NVarChar, note || '')
      .query(`INSERT INTO dbo.schedules (line_name, direction, first_bus, last_bus, interval_min, interval_peak, note)
              OUTPUT INSERTED.id
              VALUES (@line_name, @direction, @first_bus, @last_bus, @interval_min, @interval_peak, @note)`);
    res.json({ code: 0, msg: '班次添加成功', id: r.recordset[0].id });
  } catch (e) {
    console.error('schedules add error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// ============================================================
// 公告通知
// ============================================================
router.get('/announcements', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT id, title, content, type, priority, active, created_at, expires_at
      FROM dbo.announcements
      WHERE active = 1 AND (expires_at IS NULL OR expires_at > GETDATE())
      ORDER BY priority DESC, created_at DESC
    `);
    res.json({ code: 0, data: r.recordset });
  } catch (e) {
    console.error('announcements error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

router.post('/announcements', async (req, res) => {
  const { title, content, type, priority, expires_at } = req.body || {};
  try {
    if (!title || !content) return res.json({ code: 1, msg: '标题和内容不能为空' });
    const pool = await getPool();
    const r = await pool.request()
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .input('type', sql.NVarChar, type || 'notice')
      .input('priority', sql.Int, Number(priority) || 1)
      .input('expires_at', sql.DateTime, expires_at || null)
      .query(`INSERT INTO dbo.announcements (title, content, type, priority, active, expires_at)
              OUTPUT INSERTED.id
              VALUES (@title, @content, @type, @priority, 1, @expires_at)`);
    res.json({ code: 0, msg: '公告发布成功', id: r.recordset[0].id });
  } catch (e) {
    console.error('announcements add error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// ============================================================
// 实时公交到站预测（基于站点与线路数据模拟估算）
// ============================================================
router.get('/bus-arrival', async (req, res) => {
  const { station } = req.query;
  try {
    if (!station) return res.json({ code: 1, msg: '请提供站点名称' });
    const pool = await getPool();

    // 查找经过该站点的公交线路（从 stations 表模糊匹配）
    const stationResult = await pool.request()
      .input('name', sql.NVarChar, '%' + station + '%')
      .query(`SELECT TOP 1 id, name, lng, lat, area, type FROM dbo.stations WHERE name LIKE @name AND type = 'bus'`);

    if (!stationResult.recordset.length) {
      return res.json({ code: 0, data: [], msg: '未找到该站点' });
    }

    const st = stationResult.recordset[0];

    // 查找该站点的班次信息（模糊匹配线路名）
    const schedResult = await pool.request()
      .input('name', sql.NVarChar, '%' + station + '%')
      .query(`SELECT DISTINCT line_name, direction, first_bus, last_bus, interval_min, interval_peak
              FROM dbo.schedules
              WHERE line_name LIKE @name OR EXISTS (
                SELECT 1 FROM dbo.stations s WHERE s.name LIKE @name AND s.type = 'bus'
              )`);

    // 如果没匹配到该站点的班次，取所有班次做通用估算
    let schedules = schedResult.recordset;
    if (!schedules.length) {
      const allSched = await pool.request().query('SELECT TOP 6 line_name, direction, first_bus, last_bus, interval_min, interval_peak FROM dbo.schedules ORDER BY line_name');
      schedules = allSched.recordset;
    }

    // 模拟实时到站预测：根据当前时间和发车间隔估算
    const now = new Date();
    const hour = now.getHours();
    const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const interval = isPeak ? 'interval_peak' : 'interval_min';

    const arrivals = schedules.map((s, i) => {
      const baseInterval = isPeak ? (s.interval_peak || s.interval_min || 8) : (s.interval_min || 8);
      // 用站点ID做种子，让每个站点有不同的伪随机偏移
      const seed = (st.id * 7 + i * 13) % baseInterval;
      const eta = (seed + 1); // 1~interval 分钟
      // 模拟拥挤度
      const crowdSeed = (st.id + i * 3) % 3;
      const crowd = crowdSeed === 0 ? '空闲' : crowdSeed === 1 ? '适中' : '拥挤';
      return {
        line_name: s.line_name,
        direction: s.direction || '上行',
        eta_min: eta,
        interval_min: baseInterval,
        crowd,
        first_bus: s.first_bus,
        last_bus: s.last_bus,
        is_peak: isPeak
      };
    });

    res.json({
      code: 0,
      data: {
        station: st.name,
        lng: st.lng,
        lat: st.lat,
        area: st.area,
        is_peak: isPeak,
        arrivals
      }
    });
  } catch (e) {
    console.error('bus-arrival error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

module.exports = router;
