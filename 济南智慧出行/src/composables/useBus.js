// ============================================================
// useBus.js —— 公交系统（郭津铭 负责）
// 功能：
//   1) 公交线路（Mapbox 原生图层）+ 公交站点图标（L7，聚合）
//   2) 实时公交：车辆沿线路动态移动 + 站点到站预测 + 拥挤度
//   3) 实时公交到站预测对话框
//   4) 班次时刻表查询（基于线网哈希生成模拟运营时刻）
// 依赖：useShared（公共单例 + 线路几何工具 + 班次估算 + 站名查询）
// ============================================================
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { PointLayer, Popup } from '@antv/l7'
import busLinesData from '../../GIS_DATA/Jinan_bus_lines.json'
import busStopsData from '../../GIS_DATA/Jinan_bus_stops.json'

export function useBus(shared) {
  const { scene, map, ctx, buildLinesGeoJSON, lineSchedule, findStopByName } = shared

  // ---------- 公交站点图标图层 ----------
  let busStopLayer;
  let busex = ref(false);
  const busShowLines = ref(true);
  const busShowStops = ref(false);
  const BUS_STOP_NAME = 'jinan-bus-stops';

  function ensureBusStopLayer() {
    if (busStopLayer) return busStopLayer;
    if (!scene.hasImage('bus-stop-icon')) {
      scene.addImage('bus-stop-icon', 'data:image/png;base64,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');
    }
    busStopLayer = new PointLayer({
      zIndex: 7, name: BUS_STOP_NAME,
      minZoom: 12, maxZoom: 20,
      cluster: true,
      clusterOption: {
        radius: 60, maxZoom: 14,
        style: { fill: 'rgba(0, 180, 220, 0.85)', stroke: '#ffffff', strokeWidth: 2 },
      }
    })
      .source(busStopsData)
      .shape('img', () => 'bus-stop-icon')
      .size(11);
    busStopLayer.on('click', e => {
      const p = e.feature.properties;
      if (p && p.cluster) {
        map.flyTo({ center: e.lngLat, zoom: Math.min((map.getZoom() || 10) + 2, 16) });
        return;
      }
      showBusStopPrediction(p);
    });
    return busStopLayer;
  }

  function syncBusLayer() {
    if (busStopLayer) { scene.removeLayer(busStopLayer); busStopLayer = null; }
    if (busShowStops.value) scene.addLayer(ensureBusStopLayer());
    if (busShowLines.value) addBusLines();
    else removeBusLines();
    if (busShowVehicles.value) startLiveBuses(); else stopLiveBuses();
    busex.value = !!(busShowLines.value || busShowStops.value || busShowVehicles.value);
  }

  const addbus = () => {
    if (busex.value) {
      busShowLines.value = false;
      busShowStops.value = false;
      busShowVehicles.value = false;
      if (busStopLayer) { scene.removeLayer(busStopLayer); busStopLayer = null; }
      removeBusLines();
      stopLiveBuses();
      busex.value = false;
    } else {
      busShowLines.value = true;
      busShowStops.value = true;
      busShowVehicles.value = true;
      syncBusLayer();
      busex.value = true;
      ElMessage.success('实时公交已开启：车辆动态移动，点击站点查看下一班到站预测');
    }
  };

  // ---------- 公交线路（Mapbox 原生图层） ----------
  function addBusLines() {
    const geojson = buildLinesGeoJSON(busLinesData.features, 'bus');
    if (!map.getSource('bus-lines')) map.addSource('bus-lines', { type: 'geojson', data: geojson });
    else map.getSource('bus-lines').setData(geojson);
    if (!map.getLayer('bus-lines')) {
      map.addLayer({
        id: 'bus-lines', type: 'line', source: 'bus-lines',
        paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': 0.9 },
      });
    }
  }
  function removeBusLines() {
    if (map.getLayer('bus-lines')) map.removeLayer('bus-lines');
    if (map.getSource('bus-lines')) map.removeSource('bus-lines');
  }

  // ---------- 线路悬停高亮（旧实现，保留备用） ----------
  let hoveredLineId = null;
  function applyLineHover(feature, on) {
    if (on) {
      if (hoveredLineId !== null) {
        map.setFeatureState({ source: 'bus-lines', id: hoveredLineId }, { hover: false });
        hoveredLineId = null;
      }
      if (feature && feature.id !== undefined) {
        map.setFeatureState({ source: 'bus-lines', id: feature.id }, { hover: true });
        hoveredLineId = feature.id;
      }
    } else if (hoveredLineId !== null) {
      map.setFeatureState({ source: 'bus-lines', id: hoveredLineId }, { hover: false });
      hoveredLineId = null;
    }
  }

  // ============================================================
  // 实时公交（基于静态线网的前端“准实时”模拟）
  // ============================================================
  const busShowVehicles = ref(false);
  const liveBusRunning = ref(false);
  const OCC_META = [
    { label: '空闲', color: '#2ecc71' },
    { label: '适中', color: '#ffa726' },
    { label: '拥挤', color: '#ef5350' }
  ];
  const VEH_PER_LINE = 2;
  const VEH_SPEED = 7;
  const LIVE_TICK = 1200;
  let busGeoCache = null;
  let liveVehicles = [];
  let liveVehicleLayer = null;
  let liveTimer = null;

  function haversineM(a, b) {
    const R = 6371000, t = Math.PI / 180;
    const lat1 = a[1] * t, lat2 = b[1] * t;
    const dlat = (b[1] - a[1]) * t, dlng = (b[0] - a[0]) * t;
    const h = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function ensureBusGeoCache() {
    if (busGeoCache) return busGeoCache;
    busGeoCache = busLinesData.features.map(f => {
      const coords = f.geometry.coordinates || [];
      const cum = [0];
      for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + haversineM(coords[i - 1], coords[i]));
      return { name: f.properties.name, stops: f.properties.stops || [], coords, cum, total: cum[cum.length - 1] || 0 };
    }).filter(g => g.coords.length > 1 && g.total > 0);
    return busGeoCache;
  }

  function pointAlong(g, dist) {
    if (dist <= 0) return g.coords[0];
    if (dist >= g.total) return g.coords[g.coords.length - 1];
    let lo = 0, hi = g.cum.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (g.cum[mid] < dist) lo = mid + 1; else hi = mid; }
    const i = Math.max(1, lo);
    const seg = g.cum[i] - g.cum[i - 1] || 1e-6;
    const r = (dist - g.cum[i - 1]) / seg;
    const a = g.coords[i - 1], b = g.coords[i];
    return [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r];
  }

  function stopArcOn(g, lng, lat) {
    let bestI = 0, bestD = Infinity;
    for (let i = 0; i < g.coords.length; i++) {
      const d = haversineM([lng, lat], g.coords[i]);
      if (d < bestD) { bestD = d; bestI = i; }
    }
    return g.cum[bestI];
  }

  const normStop = (n) => (n || '').replace(/[0-9]+$/, '').replace(/站$/, '').trim();
  function rollOcc() { const r = Math.random(); return r < 0.4 ? 0 : (r < 0.8 ? 1 : 2); }

  function initLiveVehicles() {
    const cache = ensureBusGeoCache();
    liveVehicles = [];
    cache.forEach((g, li) => {
      for (let k = 0; k < VEH_PER_LINE; k++) {
        liveVehicles.push({
          li,
          pos: (k / VEH_PER_LINE) * g.total + Math.random() * g.total * 0.08,
          occ: rollOcc(),
          speed: VEH_SPEED * (0.8 + Math.random() * 0.5)
        });
      }
    });
  }

  function buildVehicleFeatures() {
    const cache = ensureBusGeoCache();
    return liveVehicles.map(v => {
      const g = cache[v.li];
      const c = pointAlong(g, v.pos);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: c },
        properties: { img: 'live-bus-' + v.occ, lineName: g.name, occ: v.occ }
      };
    });
  }

  function ensureLiveVehicleImages() {
    OCC_META.forEach((m, i) => {
      if (scene.hasImage('live-bus-' + i)) return;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="13" rx="3" fill="${m.color}" stroke="#ffffff" stroke-width="1.6"/>
        <rect x="6.5" y="6.5" width="11" height="4.6" rx="1" fill="rgba(255,255,255,.92)"/>
        <circle cx="8.6" cy="18.6" r="1.9" fill="#263238"/><circle cx="15.4" cy="18.6" r="1.9" fill="#263238"/>
      </svg>`;
      scene.addImage('live-bus-' + i, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    });
  }

  function stepVehicles(dtMs) {
    const cache = ensureBusGeoCache();
    liveVehicles.forEach(v => {
      const g = cache[v.li];
      v.pos += v.speed * dtMs / 1000;
      if (v.pos >= g.total) { v.pos -= g.total; v.occ = rollOcc(); }
    });
    if (liveVehicleLayer) liveVehicleLayer.setData({ type: 'FeatureCollection', features: buildVehicleFeatures() });
  }

  function startLiveBuses() {
    ensureBusGeoCache();
    ensureLiveVehicleImages();
    if (!liveVehicles.length) initLiveVehicles();
    if (!liveVehicleLayer) {
      liveVehicleLayer = new PointLayer({ zIndex: 6, name: 'live-buses', minZoom: 13, maxZoom: 20 })
        .source({ type: 'FeatureCollection', features: buildVehicleFeatures() })
        .shape('img', v => v)
        .size(14);
      liveVehicleLayer.on('mousemove', e => {
        const p = e.feature && e.feature.properties;
        if (!p) return;
        if (ctx.hoverPopup) scene.removePopup(ctx.hoverPopup);
        const m = OCC_META[p.occ];
        ctx.hoverPopup = new Popup({ offsets: [0, -12], closeButton: false, closeOnClick: false })
          .setLnglat(e.lngLat)
          .setHTML(`<div style="font-size:12px;line-height:1.7"><b>🚌 ${p.lineName}</b><br/>运营中 · 拥挤度：<b style="color:${m.color}">${m.label}</b></div>`);
        scene.addPopup(ctx.hoverPopup);
      });
      liveVehicleLayer.on('mouseout', () => { if (ctx.hoverPopup) { scene.removePopup(ctx.hoverPopup); ctx.hoverPopup = null; } });
      scene.addLayer(liveVehicleLayer);
    }
    if (liveTimer) clearInterval(liveTimer);
    let last = Date.now();
    liveTimer = setInterval(() => { const now = Date.now(); stepVehicles(now - last); last = now; }, LIVE_TICK);
    liveBusRunning.value = true;
  }

  function stopLiveBuses() {
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
    if (liveVehicleLayer) { scene.removeLayer(liveVehicleLayer); liveVehicleLayer = null; }
    liveBusRunning.value = false;
  }

  function predictBusesAtStop(stopName, lng, lat) {
    const cache = ensureBusGeoCache();
    const sn = normStop(stopName);
    const NEAR = 400;
    const out = [];
    cache.forEach((g, li) => {
      let nearD = Infinity, arc = -1;
      for (let i = 0; i < g.coords.length; i++) {
        const d = haversineM([lng, lat], g.coords[i]);
        if (d < nearD) { nearD = d; arc = g.cum[i]; }
      }
      const byName = g.stops.some(x => {
        const xn = normStop(x);
        return xn === sn || (sn && (xn.includes(sn) || sn.includes(xn)));
      });
      if (!byName && nearD > NEAR) return;
      if (arc < 0) return;
      let best = Infinity, bestOcc = 1;
      liveVehicles.forEach(v => {
        if (v.li !== li) return;
        let rem = arc - v.pos;
        if (rem < 0) rem += g.total;
        if (rem < best) { best = rem; bestOcc = v.occ; }
      });
      if (isFinite(best)) {
        out.push({ name: g.name, etaMin: Math.max(1, Math.round(best / (VEH_SPEED * 60))), distM: Math.round(best), occ: bestOcc });
      }
    });
    return out.sort((a, b) => a.etaMin - b.etaMin).slice(0, 4);
  }

  function showBusStopPrediction(p) {
    if (!busStopPredict.value) {
      map.flyTo({ center: [p.lng, p.lat], zoom: 15, pitch: 25 });
      if (ctx.popup) scene.removePopup(ctx.popup);
      ctx.popup = new Popup({ closeButton: true, closeOnClick: true }).setLnglat([p.lng, p.lat]).setHTML('<span>🚏 ' + p.name + '</span>');
      scene.addPopup(ctx.popup);
      return;
    }
    map.flyTo({ center: [p.lng, p.lat], zoom: 15, pitch: 25 });
    if (ctx.popup) scene.removePopup(ctx.popup);
    if (!liveBusRunning.value) { busShowVehicles.value = true; startLiveBuses(); }
    const rows = predictBusesAtStop(p.name, p.lng, p.lat);
    let html;
    if (!rows.length) {
      html = `<div style="font-size:13px;min-width:180px"><b style="color:#ffd54f">🚏 ${p.name}</b><div style="color:#9fb3c8;font-size:12px;line-height:1.6;margin-top:4px">该站周边 400m 内暂无已开通实时公交的线路，可换个主干道站点试试</div></div>`;
    } else {
      const items = rows.map(r => {
        const m = OCC_META[r.occ];
        const soon = r.etaMin <= 2;
        return `<div style="display:flex;align-items:center;gap:6px;margin-top:6px;padding:5px 8px;background:rgba(255,255,255,.06);border-radius:7px">
          <b style="color:#5fe0ff;min-width:48px">${r.name}</b>
          <span style="color:${soon ? '#4ade80' : '#eaf6ff'}">${soon ? '即将到站' : '约 ' + r.etaMin + ' 分钟'}</span>
          <span style="color:#8fb0c8;font-size:11px">${(r.distM / 1000).toFixed(1)}km</span>
          <span style="margin-left:auto;font-size:11px;color:#fff;background:${m.color};border-radius:8px;padding:0 7px">${m.label}</span>
        </div>`;
      }).join('');
      html = `<div style="font-size:13px;min-width:250px"><b style="color:#ffd54f">🚏 ${p.name}</b><div style="font-size:11px;color:#8fb0c8;margin-top:2px">下一班实时到站预测（共 ${rows.length} 条线路）</div>${items}</div>`;
    }
    ctx.popup = new Popup({ closeButton: true, closeOnClick: true }).setLnglat([p.lng, p.lat]).setHTML(html);
    scene.addPopup(ctx.popup);
  }

  // ---------- 实时公交到站预测对话框 ----------
  const busArrivalDialog = ref(false);
  const busArrivalStation = ref('');
  const busArrivalLoading = ref(false);
  const busArrivalData = ref(null);
  const queryBusArrival = () => {
    const kw = busArrivalStation.value.trim();
    if (!kw) { ElMessage.warning('请输入站点名称'); return; }
    busArrivalLoading.value = true;
    setTimeout(() => {
      const f = findStopByName(kw);
      if (!f) { busArrivalData.value = { station: kw, arrivals: [] }; busArrivalLoading.value = false; ElMessage.info('未找到该站点'); return; }
      if (!liveBusRunning.value) { busShowVehicles.value = true; startLiveBuses(); }
      const p = f.properties;
      const rows = predictBusesAtStop(p.name, p.lng, p.lat);
      const nowH = new Date().getHours();
      const isPeak = (nowH >= 7 && nowH <= 9) || (nowH >= 17 && nowH <= 19);
      const crowdText = ['空闲', '适中', '拥挤'];
      const arrivals = rows.map(r => {
        const lf = busLinesData.features.find(x => x.properties.name === r.name);
        const sch = lf ? lineSchedule(lf) : { first_bus: '06:00', last_bus: '21:30', interval_min: 10 };
        return {
          line_name: r.name, eta_min: r.etaMin, crowd: crowdText[r.occ],
          interval_min: sch.interval_min, first_bus: sch.first_bus, last_bus: sch.last_bus
        };
      });
      busArrivalData.value = { station: p.name, is_peak: isPeak, arrivals };
      busArrivalStation.value = p.name;
      busArrivalLoading.value = false;
    }, 250);
  };
  const flyToArrivalStation = () => {
    const name = busArrivalData.value && busArrivalData.value.station;
    const f = name && findStopByName(name);
    if (f) { map.flyTo({ center: [f.properties.lng, f.properties.lat], zoom: 15 }); busArrivalDialog.value = false; }
  };

  // ---------- 班次时刻表 ----------
  const scheduleDialog = ref(false);
  const scheduleLine = ref('');
  const scheduleLoading = ref(false);
  const scheduleList = ref([]);
  const querySchedules = () => {
    scheduleLoading.value = true;
    const kw = scheduleLine.value.trim().replace(/^K/i, '');
    setTimeout(() => {
      const list = busLinesData.features
        .filter(f => !kw || f.properties.name.includes(kw) || ('K' + f.properties.name).includes(kw))
        .map((f, i) => {
          const pr = f.properties, sch = lineSchedule(f);
          return { id: i, line_name: pr.name, direction: (pr.start || '') + ' → ' + (pr.end || ''), ...sch };
        });
      scheduleList.value = list.slice(0, 80);
      scheduleLoading.value = false;
      if (!scheduleList.value.length) ElMessage.info('未找到匹配线路');
      else ElMessage.success('共 ' + scheduleList.value.length + ' 条线路班次');
    }, 200);
  };

  // 站点到站预测开关（关闭后点击站点只显示站名）
  const busStopPredict = ref(true);

  return {
    busex, busShowLines, busShowStops, busShowVehicles, syncBusLayer, addbus,
    addBusLines, removeBusLines, applyLineHover,
    liveBusRunning, OCC_META, startLiveBuses, stopLiveBuses, predictBusesAtStop, showBusStopPrediction,
    busArrivalDialog, busArrivalStation, busArrivalLoading, busArrivalData, queryBusArrival, flyToArrivalStation,
    scheduleDialog, scheduleLine, scheduleLoading, scheduleList, querySchedules,
    busStopPredict,
  }
}
