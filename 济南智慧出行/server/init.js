// 初始化数据库：创建 jncity 库 + users/stations 表
const { sql, config } = require('./db');

async function init() {
  // 1. 连到 master，创建数据库（若不存在）
  const masterPool = await sql.connect({ ...config, database: 'master' });
  await masterPool
    .request()
    .query(`IF DB_ID(N'jncity') IS NULL CREATE DATABASE jncity`);
  await masterPool.close();
  console.log('✅ 数据库 jncity 已就绪');

  // 2. 连到 jncity，创建表（若不存在）
  const pool = await sql.connect(config);

  await pool.request().query(`
    IF OBJECT_ID(N'dbo.users', N'U') IS NULL
    CREATE TABLE dbo.users (
      id            INT IDENTITY(1,1) PRIMARY KEY,
      username      NVARCHAR(50)  NOT NULL UNIQUE,
      password_hash NVARCHAR(100) NOT NULL,
      created_at    DATETIME      DEFAULT GETDATE()
    )
  `);

  await pool.request().query(`
    IF OBJECT_ID(N'dbo.stations', N'U') IS NULL
    CREATE TABLE dbo.stations (
      id       INT IDENTITY(1,1) PRIMARY KEY,
      objectid INT,
      name     NVARCHAR(100),
      lng      FLOAT,
      lat      FLOAT,
      area     NVARCHAR(50),
      type     NVARCHAR(20)
    )
  `);

  await pool.close();
  console.log('✅ 数据表 users / stations 已就绪');
}

init().catch((e) => {
  console.error('❌ 初始化失败：', e.message);
  process.exit(1);
});
