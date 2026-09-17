// 把 GIS_DATA 里的公交站 / 地铁站导入 stations 表
const fs = require('fs');
const path = require('path');
const { sql, getPool } = require('./db');

const DATA_DIR = path.join(__dirname, '..', 'GIS_DATA');
const sources = [
  { file: 'Jinan_bus_stops.json', type: 'bus' },
  { file: 'Jinan_metro_stations.json', type: 'metro' },
];

async function importStations() {
  const pool = await getPool();

  // 清空旧数据
  await pool.request().query(`DELETE FROM dbo.stations`);

  // 用 Table 批量插入，速度快
  const table = new sql.Table('stations');
  table.create = false;
  table.columns.add('objectid', sql.Int, { nullable: true });
  table.columns.add('name', sql.NVarChar(100), { nullable: true });
  table.columns.add('lng', sql.Float, { nullable: true });
  table.columns.add('lat', sql.Float, { nullable: true });
  table.columns.add('area', sql.NVarChar(50), { nullable: true });
  table.columns.add('type', sql.NVarChar(20), { nullable: true });

  let count = 0;
  for (const src of sources) {
    const file = path.join(DATA_DIR, src.file);
    if (!fs.existsSync(file)) {
      console.warn(`⚠️  跳过不存在的文件：${file}`);
      continue;
    }
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const features = (raw.features || []);
    for (const f of features) {
      const p = f.properties || {};
      table.rows.add(p.OBJECTID, p.name, p.lng, p.lat, p.area, src.type);
      count++;
    }
    console.log(`  读取 ${src.file} -> ${features.length} 条（${src.type}）`);
  }

  const req = pool.request();
  await req.bulk(table);
  console.log(`✅ 已导入 ${count} 条站点记录到 dbo.stations`);
}

importStations()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ 导入失败：', e.message);
    process.exit(1);
  });
