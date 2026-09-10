 const file = path.join(__dirname, '..', 'jncity.sql');
  fs.writeFileSync(file, out.join('\n'), 'utf8');
  console.log(`✅ 已导出到: ${file}`);
  console.log(`   表 users: ${await (await pool.request().query('SELECT COUNT(*) c FROM dbo.users')).recordset[0].c} 条`);
  console.log(`   表 stations: ${await (await pool.request().query('SELECT COUNT(*) c FROM dbo.stations')).recordset[0].c} 条`);
}