// 初始化第一批新功能所需的数据表（可重复执行，表已存在则跳过）
// 用法：node server/initExtra.js
const { getPool } = require('./db');

async function initExtra() {
  const pool = await getPool();

  // ① 班次时刻表
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.schedules', N'U') IS NULL
    CREATE TABLE dbo.schedules (
      id           INT IDENTITY(1,1) PRIMARY KEY,
      line_name    NVARCHAR(50)  NOT NULL,   -- 线路名（如 K1路、BRT-1号线）
      direction    NVARCHAR(20)  DEFAULT '上行', -- 上行/下行
      first_bus    NVARCHAR(10),             -- 首班车 如 05:30
      last_bus     NVARCHAR(10),             -- 末班车 如 22:00
      interval_min INT           DEFAULT 8,  -- 发车间隔（分钟）
      interval_peak INT          DEFAULT 5,  -- 高峰间隔（分钟）
      note         NVARCHAR(200)             -- 备注（如"节假日加密发车"）
    )
  `);
  console.log('✅ dbo.schedules 已就绪');

  // ② 公告通知
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.announcements', N'U') IS NULL
    CREATE TABLE dbo.announcements (
      id          INT IDENTITY(1,1) PRIMARY KEY,
      title       NVARCHAR(100) NOT NULL,
      content     NVARCHAR(2000) NOT NULL,
      type        NVARCHAR(20)  DEFAULT 'notice', -- notice通知 / alert预警 / adjustment调整
      priority    INT           DEFAULT 1,        -- 1普通 / 2重要 / 3紧急
      active       BIT           DEFAULT 1,       -- 是否生效
      created_at  DATETIME      DEFAULT GETDATE(),
      expires_at  DATETIME                       -- 过期时间（NULL表示永不过期）
    )
  `);
  console.log('✅ dbo.announcements 已就绪');

  // ③ 用户收藏
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.favorites', N'U') IS NULL
    CREATE TABLE dbo.favorites (
      id         INT IDENTITY(1,1) PRIMARY KEY,
      username   NVARCHAR(50)  NOT NULL,
      type       NVARCHAR(20)  NOT NULL,  -- route路线 / station站点
      name       NVARCHAR(200) NOT NULL,  -- 收藏项名称
      detail     NVARCHAR(500),           -- JSON 附加信息（起讫坐标、线路名等）
      created_at DATETIME     DEFAULT GETDATE()
    )
  `);
  console.log('✅ dbo.favorites 已就绪');

  // ④ 搜索历史
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.search_history', N'U') IS NULL
    CREATE TABLE dbo.search_history (
      id         INT IDENTITY(1,1) PRIMARY KEY,
      username   NVARCHAR(50)  NOT NULL,
      type       NVARCHAR(20)  NOT NULL,  -- transit路线规划 / poi周边检索
      query_text NVARCHAR(300),           -- 搜索内容摘要
      detail     NVARCHAR(500),           -- JSON 附加信息
      created_at DATETIME     DEFAULT GETDATE()
    )
  `);
  console.log('✅ dbo.search_history 已就绪');

  // 插入一些示例公告数据（仅在表为空时）
  const annCount = await pool.request().query('SELECT COUNT(1) AS c FROM dbo.announcements');
  if (annCount.recordset[0].c === 0) {
    await pool.request().query(`
      INSERT INTO dbo.announcements (title, content, type, priority, active, expires_at) VALUES
      (N'欢迎使用泉城智慧出行平台', N'本平台集成了济南公交、地铁线路查询、实时路况、路线规划、交通事件上报等功能，为您提供便捷的出行服务。', N'notice', 1, 1, NULL),
      (N'高德实时路况已上线', N'平台现已接入高德地图实时交通态势数据，可查看济南市区道路畅通/缓行/拥堵状态，每60秒自动刷新。', N'notice', 1, 1, NULL),
      (N'交通事件众包上报', N'如遇交通事故、道路施工、拥堵等情况，可通过底部工具栏"事件上报"功能提交，帮助其他用户合理规划出行。', N'notice', 2, 1, NULL)
    `);
    console.log('✅ 已插入示例公告数据');
  }

  // 插入一些示例班次数据
  const schCount = await pool.request().query('SELECT COUNT(1) AS c FROM dbo.schedules');
  if (schCount.recordset[0].c === 0) {
    await pool.request().query(`
      INSERT INTO dbo.schedules (line_name, direction, first_bus, last_bus, interval_min, interval_peak, note) VALUES
      (N'K1路',  N'上行', N'05:30', N'22:00', 8, 5, N'高峰时段加密发车'),
      (N'K1路',  N'下行', N'05:30', N'22:00', 8, 5, N'高峰时段加密发车'),
      (N'K2路',  N'上行', N'05:00', N'22:30', 7, 4, N''),
      (N'K3路',  N'上行', N'05:25', N'22:00', 9, 6, N''),
      (N'BRT-1号线', N'上行', N'05:00', N'22:30', 5, 3, N'快速公交，专用道运行'),
      (N'BRT-1号线', N'下行', N'05:00', N'22:30', 5, 3, N'快速公交，专用道运行'),
      (N'1号线', N'上行', N'06:00', N'22:00', 6, 4, N'地铁1号线'),
      (N'2号线', N'上行', N'06:00', N'22:00', 6, 4, N'地铁2号线'),
      (N'3号线', N'上行', N'06:00', N'22:00', 7, 5, N'地铁3号线'),
      (N'K50路', N'上行', N'05:30', N'21:30', 10, 6, N''),
      (N'K101路', N'上行', N'05:00', N'22:30', 6, 4, N'无轨电车线路'),
      (N'K115路', N'上行', N'05:30', N'21:00', 12, 8, N'')
    `);
    console.log('✅ 已插入示例班次数据');
  }

  const summary = await pool.request().query(`
    SELECT
      (SELECT COUNT(1) FROM dbo.schedules) AS schedules,
      (SELECT COUNT(1) FROM dbo.announcements) AS announcements,
      (SELECT COUNT(1) FROM dbo.favorites) AS favorites,
      (SELECT COUNT(1) FROM dbo.search_history) AS history
  `);
  console.log('📊 数据统计：', summary.recordset[0]);
  process.exit(0);
}

initExtra().catch((e) => {
  console.error('❌ 扩展表初始化失败：', e.message);
  process.exit(1);
});
