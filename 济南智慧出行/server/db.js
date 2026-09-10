const sql = require('mssql');

// SQL Server 连接配置（SQL Server 身份验证）
const config = {
  server: 'localhost',
  port: 1433,
  user: 'sa',
  password: 'qiannian123456',
  database: 'jncity',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// 惰性连接：首次调用时才建立连接（避免库未创建时连接失败）
let poolPromise = null;
function getPool() {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(config);
    poolPromise = pool.connect();
  }
  return poolPromise;
}

module.exports = { sql, config, getPool };
