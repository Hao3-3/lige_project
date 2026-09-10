// WGS84 <-> GCJ02 坐标转换（高德使用 GCJ02，Mapbox 使用 WGS84）
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

export function wgs2gcj(lng, lat) {
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

export function gcj2wgs(gcjLng, gcjLat) {
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

// 高德 polyline 字符串 "lng,lat;lng,lat;..." -> WGS84 坐标数组
export function polyline2wgs(polyline) {
  if (!polyline) return [];
  return polyline.split(';').map(p => {
    const [lng, lat] = p.split(',').map(Number);
    return gcj2wgs(lng, lat);
  });
}
