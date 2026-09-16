// ============================================================
// useShared.js —— 公共基础（所有前端模块共享的单例、工具函数、公告、收藏/历史）
// 负责人：邵智昊（地图基础 / 公共）
// 说明：本文件不含业务功能，仅提供：
//   1) ctx  —— 跨模块共享的可变单例（popup / hoverPopup / picking）
//   2) 纯工具函数（坐标、HTML 转义、时间格式化、线路几何、班次估算等）
//   3) 公告通知（静态 + 动态，跑马灯与详情弹窗共用）
//   4) 收藏与搜索历史（localStorage 持久化）
// 每个前端成员的分支都会包含本文件（公共骨架）。
// ============================================================
import { ref, computed, inject } from 'vue'
import { ElMessage } from 'element-plus'
import busStopsData from '../../GIS_DATA/Jinan_bus_stops.json'
import metroStopsData from '../../GIS_DATA/Jinan_metro_stations.json'

export function useShared() {
  const { scene, map } = inject('$scene_map')

  // ---------- 跨模块共享的可变单例 ----------
  // popup      : L7 场景弹窗（区县/站点/POI/事件/等高线共用）
  // hoverPopup : 鼠标悬停临时弹窗（实时公交/事件/POI 共用）
  // picking    : 地图选点模式 null | 'origin' | 'dest' | 'report' | 'poi'
  const ctx = {
    popup: null,
    hoverPopup: null,
    picking: ref(null),
  }

  // ---------- 纯工具函数 ----------
  // 两点大圆距离（公里）
  function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b[1] - a[1]) * Math.PI) / 180;
    const dLng = ((b[0] - a[0]) * Math.PI) / 180;
    const la1 = (a[1] * Math.PI) / 180;
    const la2 = (b[1] * Math.PI) / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  // HTML 转义，防止站名特殊字符破坏弹窗结构
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 时间格式化（事件、收藏、历史、公告通用）
  function formatTime(t) {
    try {
      const d = new Date(t);
      if (isNaN(d.getTime())) return t || '';
      const p2 = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
    } catch (e) { return t || ''; }
  }

  // 字符串哈希（班次时刻按线路名生成稳定值）
  const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const p2n = (n) => String(n).padStart(2, '0');

  // 线路配色（公交/地铁线路通用）
  const BUS_COLORS = [
    '#ff7a45', '#ffc53d', '#36cfc9', '#40a9ff', '#9254de', '#f759ab',
    '#73d13d', '#ff4d4f', '#13c2c2', '#722ed1', '#fa8c16', '#2f54eb', '#a0d911',
  ];

  // 基于线路名哈希生成模拟运营班次
  function lineSchedule(f) {
    const pr = f.properties, h = hashStr(pr.name);
    const interval = 6 + h % 9, interval_peak = Math.max(3, interval - 3);
    const notes = ['平峰约' + interval + '分钟一班', '高峰缩短发车间隔', '途经主要客流走廊', '夜间班次间隔适当延长'];
    return {
      first_bus: p2n(5 + (h % 2)) + ':' + p2n((h * 13) % 60),
      last_bus: p2n(20 + (h % 3)) + ':' + p2n((h * 17) % 60),
      interval_min: interval, interval_peak, note: notes[h % notes.length]
    };
  }

  // 站点名 -> [lng, lat] 查找表（来自公交/地铁站点数据），供弹窗内点击站点飞行定位
  function stationCoordsOf(f) {
    const p = (f && f.properties) || {};
    if (p && p.name != null && p.lng != null && p.lat != null) {
      return { name: String(p.name).trim(), lng: p.lng, lat: p.lat };
    }
    if (p && p.name != null && f.geometry && Array.isArray(f.geometry.coordinates)) {
      const c = f.geometry.coordinates;
      if (c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1])) {
        return { name: String(p.name).trim(), lng: c[0], lat: c[1] };
      }
    }
    if (p && p.name != null) return { name: String(p.name).trim(), lng: null, lat: null };
    return null;
  }
  const STATION_COORDS = (() => {
    const map = {};
    for (const data of [metroStopsData, busStopsData]) {
      if (!data || !data.features) continue;
      for (const f of data.features) {
        const s = stationCoordsOf(f);
        if (!s) continue;
        if (Object.prototype.hasOwnProperty.call(map, s.name)) continue;
        if (s.lng != null && s.lat != null) map[s.name] = [s.lng, s.lat];
        else map[s.name] = null;
      }
    }
    return map;
  })();

  // 为线路集合生成 Mapbox 源数据（每条线带 真实长度/起终点/途经站点）
  function buildLinesGeoJSON(features, mode) {
    return {
      type: 'FeatureCollection',
      features: features.map((f, idx) => {
        const coords = f.geometry.coordinates;
        const p = f.properties || {};
        const name = p.name;
        let km = p.distance ? Math.round(Number(p.distance) * 10) / 10 : null;
        if (!km) {
          let s = 0;
          for (let i = 1; i < coords.length; i++) s += haversineKm(coords[i - 1], coords[i]);
          km = Math.round(s * 10) / 10;
        }
        const stops = p.stops || [];
        const stopInfoJson = JSON.stringify(stops.map((s, i) => {
          const nm = String(s).trim();
          const c = STATION_COORDS[nm];
          if (c) return { name: nm, lng: c[0], lat: c[1] };
          const n = Math.max(stops.length, 1);
          const ratio = coords && coords.length ? i / (n - 1 || 1) : 0;
          const ci = Math.round(ratio * (coords.length - 1));
          const approx = coords[Math.min(Math.max(ci, 0), coords.length - 1)];
          return approx ? { name: nm, lng: approx[0], lat: approx[1] } : { name: nm, lng: null, lat: null };
        }));
        return {
          type: 'Feature',
          properties: {
            name,
            type: p.type || (mode === 'metro' ? '地铁' : '公交'),
            color: p.color || BUS_COLORS[idx % BUS_COLORS.length],
            start: p.start || '',
            end: p.end || '',
            stops: p.stops || [],
            stopInfoJson,
            km,
          },
          geometry: { type: 'LineString', coordinates: coords },
        };
      }),
    };
  }

  // 线路信息弹窗 HTML（公交/地铁通用）
  function linePopupHTML(p) {
    let stopItems = [];
    if (p.stopInfoJson) {
      try { stopItems = JSON.parse(p.stopInfoJson); } catch (e) { stopItems = []; }
    }
    if (!Array.isArray(stopItems) || !stopItems.length) {
      const stops = Array.isArray(p.stops) ? p.stops : String(p.stops || '').split(',').filter(Boolean);
      stopItems = stops.map((s) => {
        const nm = String(s).trim();
        const c = STATION_COORDS[nm];
        return c ? { name: nm, lng: c[0], lat: c[1] } : { name: nm, lng: null, lat: null };
      });
    }
    const stopChips = stopItems.map((it) => {
      const name = String(it && it.name ? it.name : '').trim();
      const has = it && it.lng != null && it.lat != null && Number.isFinite(Number(it.lng)) && Number.isFinite(Number(it.lat));
      if (!has) return `<span style="color:#ffd04b">${escapeHtml(name)}</span>`;
      return `<span class="jinan-station" data-lng="${it.lng}" data-lat="${it.lat}" title="点击飞往该站"
        style="color:#ffd04b;cursor:pointer;text-decoration:underline;text-underline-offset:2px">${escapeHtml(name)}</span>`;
    }).join(' <span style="color:#7a8aa0">→</span> ');
    const stopsLine = stopItems.length
      ? `<div>🚏 途经站点（${stopItems.length} 站，点击可定位）：<div class="jinan-stops" style="max-height:120px;overflow-y:auto;color:#ffd04b;line-height:1.9;padding-right:4px">${stopChips}</div></div>`
      : '';
    const headLine = p.start || p.end
      ? `<div>🔁 起讫站：<b style="color:#69d5ff">${p.start} ⇌ ${p.end}</b></div>`
      : '';
    return `
      <div style="font-family:'Microsoft YaHei',Arial,sans-serif;color:#fff;max-width:340px">
        <div style="font-size:14px;font-weight:bold;color:${p.color};margin-bottom:8px">${p.name}（${p.type}）</div>
        <div style="font-size:12px;line-height:1.8">
          ${headLine}
          <div>📏 线路全长：<b style="color:#9be15d">${p.km} 公里</b></div>
          ${stopsLine}
        </div>
      </div>`;
  }

  // 按站名查找公交站点（到站预测 / 收藏定位共用）
  const findStopByName = (kw) => {
    const norm = n => (n || '').replace(/[0-9]+$/, '').trim();
    const list = busStopsData.features;
    return list.find(f => f.properties.name === kw)
      || list.find(f => f.properties.name.includes(kw) || kw.includes(f.properties.name))
      || list.find(f => norm(f.properties.name) === norm(kw));
  };

  // 公告类型标签
  const annTypeLabel = (t) => ({ alert: '预警', adjustment: '调整', other: '通知', traffic: '路况', event: '事件' }[t] || '通知');

  // ---------- 公告通知（静态 + 动态） ----------
  const announceDialog = ref(false);
  const staticAnnouncements = ref([
    { id: 1, type: 'alert', priority: 'high', title: '早晚高峰拥堵提醒', content: '工作日 7:30-9:00、17:30-19:00 经十路、北园高架、二环南高架车流较大，建议错峰或优先选择地铁公交出行。', created_at: new Date().toISOString() },
    { id: 2, type: 'adjustment', priority: 'mid', title: '道路施工与绕行提示', content: '市区部分主次干道开展养护施工，途经车辆请按现场交通标志减速慢行，或提前规划绕行路线。', created_at: new Date().toISOString() },
    { id: 3, type: 'other', priority: 'low', title: '绿色出行与实时公交', content: '公交地铁接驳可享换乘优惠；平台已上线实时公交到站预测，点击公交站点即可查看下一班到站时间与拥挤度。', created_at: new Date().toISOString() },
    { id: 4, type: 'alert', priority: 'high', title: '雨天出行提示', content: '今日有阵雨，路面湿滑，高架与下穿隧道易积水，请减速慢行、保持车距。', created_at: new Date().toISOString() },
    { id: 5, type: 'other', priority: 'low', title: '地铁新线运营', content: '济南地铁4号线、6号线已开通运营，可通过地图「地铁系统」查看实时线路与站点。', created_at: new Date().toISOString() },
    { id: 6, type: 'adjustment', priority: 'mid', title: '公交专用道启用', content: '经十路、旅游路公交专用道工作日 7:00-9:00、17:00-19:00 启用，社会车辆请勿占用。', created_at: new Date().toISOString() },
    { id: 7, type: 'other', priority: 'low', title: '事件上报指引', content: '如遇交通事故、道路施工等突发情况，可通过底部「事件上报」功能在地图选点上报，便于其他市民及时绕行。', created_at: new Date().toISOString() }
  ]);
  const dynamicAnnouncements = ref([]);
  const allAnnouncements = computed(() => [...dynamicAnnouncements.value, ...staticAnnouncements.value]);
  const announcements = allAnnouncements;
  function upsertDynamicAnn(id, ann) {
    const idx = dynamicAnnouncements.value.findIndex(a => a.id === id);
    if (idx >= 0) dynamicAnnouncements.value[idx] = { ...ann, id };
    else dynamicAnnouncements.value.unshift({ ...ann, id });
  }
  function removeDynamicAnn(id) {
    dynamicAnnouncements.value = dynamicAnnouncements.value.filter(a => a.id !== id);
  }

  // ---------- 收藏与搜索历史（localStorage 持久化） ----------
  const FAV_KEY = 'jncity_favorites', HIST_KEY = 'jncity_history';
  function safeParseArr(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } }
  const favDialog = ref(false);
  const favTab = ref('favorites');
  const favList = ref(safeParseArr(FAV_KEY));
  const historyList = ref(safeParseArr(HIST_KEY));
  const persistFav = () => localStorage.setItem(FAV_KEY, JSON.stringify(favList.value));
  const persistHist = () => localStorage.setItem(HIST_KEY, JSON.stringify(historyList.value));
  const openFavDialog = () => { favDialog.value = true; };
  const removeFavorite = (id) => { favList.value = favList.value.filter(f => f.id !== id); persistFav(); ElMessage.success('已取消收藏'); };
  const clearHistory = () => { historyList.value = []; persistHist(); ElMessage.success('已清空搜索历史'); };
  const addFavorite = (name, type = 'route') => {
    if (!name) return;
    if (favList.value.some(f => f.name === name)) { ElMessage.info('已在收藏列表中'); return; }
    favList.value.unshift({ id: 'f' + Date.now(), type, name, created_at: new Date().toISOString() });
    persistFav(); ElMessage.success('已收藏：' + name);
  };
  const addHistory = (query_text, type = 'transit') => {
    if (!query_text) return;
    historyList.value = historyList.value.filter(h => h.query_text !== query_text);
    historyList.value.unshift({ id: 'h' + Date.now(), query_text, type, created_at: new Date().toISOString() });
    historyList.value = historyList.value.slice(0, 30);
    persistHist();
  };

  return {
    scene, map, ctx,
    haversineKm, escapeHtml, formatTime, hashStr, p2n, BUS_COLORS, lineSchedule,
    stationCoordsOf, STATION_COORDS, buildLinesGeoJSON, linePopupHTML,
    findStopByName, annTypeLabel,
    announceDialog, staticAnnouncements, dynamicAnnouncements, allAnnouncements, announcements, upsertDynamicAnn, removeDynamicAnn,
    favDialog, favTab, favList, historyList, openFavDialog, removeFavorite, clearHistory, addFavorite, addHistory,
  }
}
