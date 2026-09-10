const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const svgCaptcha = require('svg-captcha');
const crypto = require('crypto');
const { sql, getPool } = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 验证码存储：id -> { text, expires }
const captchaStore = new Map();
// 登录令牌存储：token -> { username, expires }
const tokenStore = new Map();

function cleanExpired(store) {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expires < now) store.delete(k);
  }
}
setInterval(() => {
  cleanExpired(captchaStore);
  cleanExpired(tokenStore);
}, 10 * 60 * 1000);

// ---------- 生成图片验证码 ----------
app.get('/api/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 3,
    color: true,
    ignoreChars: '0oO1ilI',
    width: 120,
    height: 40,
    fontSize: 46,
    background: '#f0f2f5',
  });
  const id = crypto.randomUUID();
  captchaStore.set(id, {
    text: captcha.text.toLowerCase(),
    expires: Date.now() + 5 * 60 * 1000,
  });
  res.json({ code: 0, captchaId: id, svg: captcha.data });
});

function verifyCaptcha(id, input) {
  const item = captchaStore.get(id);
  if (!item) return false;
  captchaStore.delete(id); // 一次性使用，防重放
  if (Date.now() > item.expires) return false;
  return item.text === String(input || '').toLowerCase().trim();
}

// ---------- 注册 ----------
app.post('/api/register', async (req, res) => {
  const { username, password, captchaId, captcha } = req.body || {};
  try {
    if (!username || !password) return res.json({ code: 1, msg: '用户名和密码不能为空' });
    if (!/^[一-龥A-Za-z0-9_]{2,20}$/.test(username)) {
      return res.json({ code: 1, msg: '用户名 2-20 位，仅限中英文、数字、下划线' });
    }
    if (String(password).length < 6) return res.json({ code: 1, msg: '密码至少 6 位' });
    if (!verifyCaptcha(captchaId, captcha)) return res.json({ code: 1, msg: '验证码错误或已过期' });

    const pool = await getPool();
    const exists = await pool
      .request()
      .input('u', sql.NVarChar, username)
      .query('SELECT id FROM dbo.users WHERE username = @u');
    if (exists.recordset.length) return res.json({ code: 1, msg: '用户名已存在' });

    const hash = bcrypt.hashSync(String(password), 10);
    await pool
      .request()
      .input('u', sql.NVarChar, username)
      .input('p', sql.NVarChar, hash)
      .query('INSERT INTO dbo.users (username, password_hash) VALUES (@u, @p)');

    res.json({ code: 0, msg: '注册成功，请登录' });
  } catch (e) {
    console.error('register error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// ---------- 登录 ----------
app.post('/api/login', async (req, res) => {
  const { username, password, captchaId, captcha } = req.body || {};
  try {
    if (!verifyCaptcha(captchaId, captcha)) return res.json({ code: 1, msg: '验证码错误或已过期' });

    const pool = await getPool();
    const r = await pool
      .request()
      .input('u', sql.NVarChar, username)
      .query('SELECT id, username, password_hash FROM dbo.users WHERE username = @u');
    if (!r.recordset.length) return res.json({ code: 1, msg: '用户名或密码错误' });

    const user = r.recordset[0];
    if (!bcrypt.compareSync(String(password), user.password_hash)) {
      return res.json({ code: 1, msg: '用户名或密码错误' });
    }

    const token = crypto.randomUUID();
    tokenStore.set(token, { username: user.username, expires: Date.now() + 24 * 3600 * 1000 });
    res.json({ code: 0, msg: '登录成功', token, username: user.username });
  } catch (e) {
    console.error('login error:', e.message);
    res.status(500).json({ code: 1, msg: '服务器错误' });
  }
});

// ---------- 校验登录态 ----------
app.get('/api/me', (req, res) => {
  const token = req.headers.authorization || '';
  const item = tokenStore.get(token);
  if (item && item.expires > Date.now()) {
    return res.json({ code: 0, username: item.username });
  }
  res.json({ code: 1, msg: '未登录' });
});

// ---------- 站点信息 ----------
app.get('/api/stations', async (req, res) => {
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

// ---------- 交通事件：查询列表（最新在前） ----------
app.get('/api/events', async (req, res) => {
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

// ---------- 交通事件：上报 ----------
app.post('/api/events', async (req, res) => {
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

// ---------- 交通事件：删除 ----------
app.delete('/api/events/:id', async (req, res) => {
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

// ============================================================
// ① 班次时刻表
// ============================================================
app.get('/api/schedules', async (req, res) => {
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
app.post('/api/schedules', async (req, res) => {
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
// ② 公告通知
// ============================================================
app.get('/api/announcements', async (req, res) => {
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

app.post('/api/announcements', async (req, res) => {
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
// ③ 实时公交到站预测（基于站点与线路数据模拟估算）
// ============================================================
app.get('/api/bus-arrival', async (req, res) => {
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

// ============================================================
// ④ 收藏与历史记录
// ============================================================
// 收藏列表
app.get('/api/favorites', async (req, res) => {
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
app.post('/api/favorites', async (req, res) => {
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
app.delete('/api/favorites/:id', async (req, res) => {
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

// 搜索历史列表
app.get('/api/history', async (req, res) => {
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
app.post('/api/history', async (req, res) => {
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
app.delete('/api/history', async (req, res) => {
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

// 启动
getPool()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 后端已启动: http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('❌ 数据库连接失败：', e.message);
    process.exit(1);
  });
