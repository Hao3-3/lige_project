// 从高德 WebService「公交线路查询」拉取济南真实公交 / 地铁线路（沿真实道路的 polyline + 途经站点），
// 替换 GIS_DATA/Jinan_bus_lines.json 与 Jinan_metro_lines.json 里的虚拟/粗略直线数据。
// 用法：node server/importBusLines.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const AMAP_KEY = 'f752ae50b3478617343635244aa5c843';
const CITY = '济南';

// 需要抓取的公交线路关键字（脚本会自动匹配高德里的真实线路名，K/B 前缀自动归一、方向自动去重）
// 已收录济南市区主要线路（K/B 前缀、BRT、游系等）
const BUS_KEYWORDS = [
  // 核心骨架线（原 13 条）
  'K1路', 'K2路', 'K3路', 'K5路', 'K7路', 'K9路', 'K10路', 'K19路', 'K30路',
  'K33路', 'K39路', 'K49路', 'K51路', 'K52路', 'K56路', 'K66路', 'K73路',
  'K91路', 'K101路', 'K102路', 'K104路', 'K202路',
  'BRT-1号线', 'BRT-2号线', 'BRT-3号线', 'BRT-4号线',
  // 新增市区线路
  'K4路', 'K6路', 'K8路', 'K11路', 'K12路', 'K14路', 'K15路', 'K16路', 'K18路',
  'K20路', 'K21路', 'K22路', 'K27路', 'K28路', 'K31路', 'K32路', 'K37路',
  'K41路', 'K45路', 'K46路', 'K47路', 'K50路', 'K55路', 'K57路', 'K58路',
  'K62路', 'K63路', 'K64路', 'K68路', 'K70路', 'K72路', 'K75路', 'K80路',
  'K85路', 'K86路', 'K90路', 'K92路', 'K93路', 'K95路', 'K98路', 'K103路',
  'K106路', 'K111路', 'K115路', 'K116路', 'K118路', 'K119路', 'K123路',
  'K128路', 'K131路', 'K133路', 'K146路', 'K155路', 'K161路', 'K166路',
  'K169路', 'K171路', 'K178路', 'K183路', 'K186路', 'K188路', 'K189路',
  'K201路', 'K205路', 'K209路', 'K301路', 'KR1',
  '游777路',
];

// 济南现运营的 5 条轨道交通线路（高德里名称带「轨道交通」前缀）
// 1/2/3 已开通，4/6 为在建/规划，抓取时若高德尚未收录会正常跳过（打印候选）
const METRO_LINES = [
  { name: '1号线', keyword: '轨道交通1号线', color: '#a78bfa' },
  { name: '2号线', keyword: '轨道交通2号线', color: '#38bdf8' },
  { name: '3号线', keyword: '轨道交通3号线', color: '#fbbf24' },
  { name: '4号线', keyword: '轨道交通4号线', color: '#f472b6' },
  { name: '6号线', keyword: '轨道交通6号线', color: '#34d399' },
];

// ---------- 坐标转换（高德 GCJ02 -> WGS84，与 src/Hooks/coord.js 一致） ----------
function outOfChina(lng, lat) {
  return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271);
}
function tLat(x, y) {
  let r = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  r += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  r += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
  r += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
  return r;
}
function tLon(x, y) {
  let r = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  r += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  r += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
  r += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
  return r;
}
const A = 6378245.0, EE = 0.00669342162296594323;
function wgs2gcj(lng, lat) {
  if (outOfChina(lng, lat)) return [lng, lat];
  let dLat = tLat(lng - 105.0, lat - 35.0);
  let dLng = tLon(lng - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * Math.PI);
  dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * Math.PI);
  return [lng + dLng, lat + dLat];
}
function gcj2wgs(gcjLng, gcjLat) {
  if (outOfChina(gcjLng, gcjLat)) return [gcjLng, gcjLat];
  let wgsLng = gcjLng, wgsLat = gcjLat;
  for (let i = 0; i < 5; i++) {
    const [cLng, cLat] = wgs2gcj(wgsLng, wgsLat);
    const dLng = cLng - gcjLng, dLat = cLat - gcjLat;
    wgsLng -= dLng; wgsLat -= dLat;
    if (Math.abs(dLng) < 1e-10 && Math.abs(dLat) < 1e-10) break;
  }
  return [wgsLng, wgsLat];
}
function polyline2wgs(polyline) {
  if (!polyline) return [];
  return polyline.split(';').map((p) => {
    const [lng, lat] = p.split(',').map(Number);
    return gcj2wgs(lng, lat);
  });
}
function loc2wgs(location) {
  const [lng, lat] = location.split(',').map(Number);
  return gcj2wgs(lng, lat);
}

// ---------- HTTP 请求（带重试与限流） ----------
function getJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('JSON 解析失败：' + body.slice(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('请求超时')));
  });
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function queryBusline(keyword) {
  const url =
    `https://restapi.amap.com/v3/bus/linename?key=${AMAP_KEY}` +
    `&city=${encodeURIComponent(CITY)}&keywords=${encodeURIComponent(keyword)}&extensions=all&offset=20`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const data = await getJSON(url);
    if (data.status === '1') return data;
    if (data.infocode === '10021') { // 超频，退避后重试
      await sleep(1200 * (attempt + 1));
      continue;
    }
    throw new Error(`高德接口错误 infocode=${data.infocode} info=${data.info}`);
  }
  throw new Error('重试多次仍被限流');
}

// ---------- 线路名归一化与匹配 ----------
// 提取线路编号：去方向括号/空格/横线、转小写、去 K/B 前缀
function routeNum(name) {
  let base = String(name).split('(')[0].trim().toLowerCase();
  base = base.replace(/[^a-z0-9一-龥]/g, '');
  base = base.replace(/^k(?=\d)/, '').replace(/^b(?=\d)/, '');
  return base;
}
// 需要跳过的线路：通勤定制线(T)、接驳线、支线、赶集线、二期工程段
function shouldSkip(name) {
  const n = String(name);
  if (/^t\d/i.test(n.split('(')[0].trim())) return true;
  if (/接驳|支线|赶集|二期/.test(n)) return true;
  return false;
}
// 是否为 BRT 线路（用于显示类型标注）
function isBrt(name) {
  const base = String(name).split('(')[0].trim().toLowerCase();
  return base.startsWith('brt') || /^b\d/.test(base);
}

// 从候选中挑一条匹配 target 的线路（编号一致，排除方向重复 / 通勤 / 接驳等）
function pickLine(buslines, targetKeyword) {
  if (!Array.isArray(buslines)) return null;
  const target = routeNum(targetKeyword);
  let fallback = null;
  for (const b of buslines) {
    const full = b.name || '';
    if (shouldSkip(full)) continue;
    // 去掉「/夜」等复合标注，只看主编号是否一致（如 K118路/夜118路 -> 118路）
    const baseName = String(full).split('/')[0].trim();
    if (routeNum(baseName) === target) return b; // 精确匹配编号
    if (routeNum(full) === target) return b;
    if (!fallback) fallback = b;
  }
  return null; // 不精确匹配时宁可跳过，避免抓错线路
}

// 把一条高德线路记录转成 Feature
function toFeature(picked, name, type, color) {
  const coords = polyline2wgs(picked.polyline);
  const stops = (picked.busstops || []).map((s) => {
    const [lng, lat] = loc2wgs(s.location);
    return { name: s.name, lng, lat, sequence: s.sequence };
  });
  return {
    type: 'Feature',
    properties: {
      name,
      type,
      color: color || '',
      start: picked.start_stop || '',
      end: picked.end_stop || '',
      distance: picked.distance || '',
      stops: stops.map((s) => s.name),
    },
    geometry: { type: 'LineString', coordinates: coords },
  };
}

async function main() {
  const busOut = path.join(__dirname, '..', 'GIS_DATA', 'Jinan_bus_lines.json');
  const metroOut = path.join(__dirname, '..', 'GIS_DATA', 'Jinan_metro_lines.json');

  // ---------- 公交 ----------
  const busFeatures = [];
  console.log('== 公交线路 ==');
  for (const kw of BUS_KEYWORDS) {
    try {
      const data = await queryBusline(kw);
      const picked = pickLine(data.buslines, kw);
      if (!picked) {
        const names = (data.buslines || []).slice(0, 5).map((b) => b.name).join('、');
        console.warn(`⚠️  ${kw}：未匹配（候选：${names || '无'}）`);
      } else {
        const base = picked.name.split('(')[0].trim(); // 真实线路名（如 "K4路" / "B4路" / "BRT-3号线"）
        busFeatures.push(toFeature(picked, base, isBrt(base) ? 'BRT' : '公交', ''));
        console.log(`✅ ${kw} -> ${picked.name}｜${picked.polyline.split(';').length} 点｜${(picked.busstops || []).length} 站`);
      }
    } catch (e) {
      console.error(`❌ ${kw}：${e.message}`);
    }
    await sleep(650);
  }

  // ---------- 地铁 ----------
  // 读取上一次已落盘的地铁线路（含手动新增的 4/6 号线占位折线），供「高德未收录时保留」使用
  let metroFeaturesAll = [];
  try {
    metroFeaturesAll = JSON.parse(fs.readFileSync(metroOut, 'utf8')).features || [];
  } catch (e) { /* 首次运行尚无落盘文件，忽略 */ }
  const metroFeatures = [];
  console.log('\n== 地铁线路 ==');
  for (const m of METRO_LINES) {
    try {
      const data = await queryBusline(m.keyword);
      // 地铁：只看 type 为「地铁」的，且线路名精确等于「轨道交通N号线」（排除二期/接驳）
      const picked = (data.buslines || []).find((b) => {
        if (b.type !== '地铁') return false;
        const base = b.name.split('(')[0].trim().toLowerCase().replace(/[^a-z0-9一-龥]/g, '');
        return base === m.keyword.toLowerCase();
      });
      if (!picked) {
        // 若高德尚未收录该线路（如在建的 4/6 号线），保留上次落盘的占位折线，避免覆盖丢失
        const prev = metroFeaturesAll.find((f) => f.properties.name === m.name);
        if (prev) {
          console.warn(`⚠️  ${m.name}：高德未收录（候选：${(data.buslines || []).slice(0, 5).map((b) => `${b.name}(${b.type})`).join('、') || '无'}），保留现有折线`);
          metroFeatures.push(prev);
        } else {
          const names = (data.buslines || []).slice(0, 5).map((b) => `${b.name}(${b.type})`).join('、');
          console.warn(`⚠️  ${m.name}：未匹配（候选：${names || '无'}）`);
        }
      } else {
        metroFeatures.push(toFeature(picked, m.name, '地铁', m.color));
        console.log(`✅ ${m.name} -> ${picked.name}｜${picked.polyline.split(';').length} 点｜${(picked.busstops || []).length} 站`);
      }
    } catch (e) {
      console.error(`❌ ${m.name}：${e.message}`);
    }
    await sleep(650);
  }

  fs.writeFileSync(busOut, JSON.stringify({ type: 'FeatureCollection', features: busFeatures }, null, 2), 'utf8');
  fs.writeFileSync(metroOut, JSON.stringify({ type: 'FeatureCollection', features: metroFeatures }, null, 2), 'utf8');
  console.log(`\n已写入：\n  公交 ${busFeatures.length} 条 -> ${busOut}\n  地铁 ${metroFeatures.length} 条 -> ${metroOut}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
