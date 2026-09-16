// 导出 jncity 数据库为 .sql 文件（建库 + 建表 + 全量数据 INSERT）
const fs = require('fs');
const path = require('path');
const { sql, getPool } = require('./db');

// 转义为 SQL 字面量
function q(v) {
  if (v === null || v === undefined) return 'NULL';
  if (v instanceof Date) {
    const p = (n) => String(n).padStart(2, '0');
    return `'${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())} ${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}'`;
  }
  if (typeof v === 'number') return String(v);
  return "N'" + String(v).replace(/'/g, "''") + "'";
}

// 表结构（与 init.js 一致）444
const SCHEMA = {
  users: {
    cols: ['id', 'username', 'password_hash', 'created_at'],
    ddl: `CREATE TABLE dbo.users (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  username      NVARCHAR(50)  NOT NULL UNIQUE,
  password_hash NVARCHAR(100) NOT NULL,
  created_at    DATETIME      DEFAULT GETDATE()
)`,
  },
  stations: {
    cols: ['id', 'objectid', 'name', 'lng', 'lat', 'area', 'type'],
    ddl: `CREATE TABLE dbo.stations (
  id       INT IDENTITY(1,1) PRIMARY KEY,
  objectid INT,
  name     NVARCHAR(100),
  lng      FLOAT,
  lat      FLOAT,
  area     NVARCHAR(50),
  type     NVARCHAR(20)
)`,
  },
};

async function main() {
  const pool = await getPool();
  const out = [];
  out.push('-- 济南智慧出行 数据库 jncity 导出');
  out.push('-- 导出时间: ' + new Date().toLocaleString('zh-CN'));
  out.push('');
  out.push("IF DB_ID(N'jncity') IS NULL CREATE DATABASE jncity;");
  out.push('GO');
  out.push('USE jncity;');
  out.push('GO');
  out.push('');

  for (const table of Object.keys(SCHEMA)) {
    const { cols, ddl } = SCHEMA[table];
    const r = await pool.request().query(`SELECT * FROM dbo.${table} ORDER BY id`);
    const rows = r.recordset;

    out.push(`-- ============ 表 dbo.${table}（${rows.length} 条）============`);
    out.push(`IF OBJECT_ID(N'dbo.${table}', N'U') IS NOT NULL DROP TABLE dbo.${table};`);
    out.push('GO');
    out.push(ddl);
    out.push('GO');
    out.push('');

    if (rows.length) {
      out.push(`SET IDENTITY_INSERT dbo.${table} ON;`);
      out.push('GO');
      const colList = cols.join(', ');
      for (const row of rows) {
        const vals = cols.map((c) => q(row[c])).join(', ');
        out.push(`INSERT INTO dbo.${table} (${colList}) VALUES (${vals});`);
      }
      out.push(`SET IDENTITY_INSERT dbo.${table} OFF;`);
      out.push('GO');
      out.push('');
    }
  }

  const file = path.join(__dirname, '..', 'jncity.sql');
  fs.writeFileSync(file, out.join('\n'), 'utf8');
  console.log(`✅ 已导出到: ${file}`);
  console.log(`   表 users: ${await (await pool.request().query('SELECT COUNT(*) c FROM dbo.users')).recordset[0].c} 条`);
  console.log(`   表 stations: ${await (await pool.request().query('SELECT COUNT(*) c FROM dbo.stations')).recordset[0].c} 条`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ 导出失败：', e.message);
    process.exit(1);
  });
