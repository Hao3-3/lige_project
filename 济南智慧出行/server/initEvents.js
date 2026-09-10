// 初始化交通事件表 dbo.events（可重复执行，表已存在则跳过）
const { getPool } = require('./db');

async function initEvents() {
  const pool = await getPool();
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.events', N'U') IS NULL
    CREATE TABLE dbo.events (
      id          INT IDENTITY(1,1) PRIMARY KEY,
      type        NVARCHAR(20)  NOT NULL,   -- accident事故 / construction施工 / congestion拥堵 / control管制
      level       INT           DEFAULT 2,  -- 1一般 / 2较重 / 3严重
      lng         FLOAT         NOT NULL,
      lat         FLOAT         NOT NULL,
      address     NVARCHAR(200),            -- 地点描述
      description NVARCHAR(500),            -- 事件描述
      username    NVARCHAR(50),             -- 上报人
      created_at  DATETIME      DEFAULT GETDATE()
    )
  `);
  const r = await pool.request().query('SELECT COUNT(1) AS c FROM dbo.events');
  console.log('✅ dbo.events 已就绪，当前事件数：', r.recordset[0].c);
  process.exit(0);
}

initEvents().catch((e) => {
  console.error('❌ 事件表初始化失败：', e.message);
  process.exit(1);
});
