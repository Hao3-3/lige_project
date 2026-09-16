// 认证模块：图形验证码 / 注册 / 登录 / 登录态校验
const express = require('express');
const bcrypt = require('bcryptjs');
const svgCaptcha = require('svg-captcha');
const crypto = require('crypto');
const { sql, getPool } = require('../db');

const router = express.Router();

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
router.get('/captcha', (req, res) => {
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
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
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
router.get('/me', (req, res) => {
  const token = req.headers.authorization || '';
  const item = tokenStore.get(token);
  if (item && item.expires > Date.now()) {
    return res.json({ code: 0, username: item.username });
  }
  res.json({ code: 1, msg: '未登录' });
});

module.exports = router;
