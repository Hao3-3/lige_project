// ============================================================
// useTransit.js —— 出行导航与工具（艾合太木江 负责）
// 功能：
//   1) 公交/驾车/步行 路线规划（高德 direction API，多备选方案）
//   2) 车道级导航浮层
//   3) 实时路况图层（高德交通态势）
//   4) 交通事件上报（选点 -> 表单 -> 后端 /api/events）
//   5) 周边设施 POI 检索（高德 place/around）
//   6) 路线收藏 / 历史回放（收藏此路线、按历史重规划）
// 依赖：useShared（公共单例 + 工具 + 收藏/历史 + 公告）
// ============================================================
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { PointLayer, Popup } from '@antv/l7'
import mapboxgl from 'mapbox-gl'
import { wgs2gcj, gcj2wgs, polyline2wgs } from '../Hooks/coord'

export function useTransit(shared) {
  const {
    scene, map, ctx,
    formatTime, lineSchedule, findStopByName,
    addFavorite, addHistory, upsertDynamicAnn, removeDynamicAnn, favDialog,
  } = shared

  // ---------- 公交路线规划 ----------
  const landmarks = [
    { name: '泉城广场', lng: 117.02, lat: 36.65 },
    { name: '大明湖', lng: 117.02, lat: 36.68 },
    { name: '奥体中心', lng: 117.07, lat: 36.64 },
    { name: '济南站', lng: 116.98, lat: 36.67 },
    { name: '千佛山', lng: 117.02, lat: 36.63 },
    { name: '趵突泉', lng: 117.01, lat: 36.66 },
  ];
  const transitVisible = ref(false);
  const originName = ref('泉城广场');
  const destName = ref('奥体中心');
  const travelMode = ref('综合');
  const routeInfo = ref(null);
  const routeDetailDialog = ref(false);
  const routeDetail = ref(null);
  const routeBounds = ref(null);
  const originPicked = ref(null);
  const destPicked = ref(null);

  const startPick = (which) => {
    ctx.picking.value = which;
    transitVisible.value = false;
    ElMessage.info(`请在地图上点击选择${which === 'origin' ? '起点' : '终点'}`);
  };

  const queryTransit = () => {
    const o = originPicked.value
      ? { lng: originPicked.value.lng, lat: originPicked.value.lat }
      : landmarks.find(l => l.name === originName.value);
    const d = destPicked.value
      ? { lng: destPicked.value.lng, lat: destPicked.value.lat }
      : landmarks.find(l => l.name === destName.value);
    if (!o || !d) { ElMessage.warning('请选择起点和终点'); return; }
    if (travelMode.value === '驾车' || travelMode.value === '步行') {
      queryDriveOrWalk(o, d);
      return;
    }
    const [ogcLng, ogcLat] = wgs2gcj(o.lng, o.lat);
    const [dgcLng, dgcLat] = wgs2gcj(d.lng, d.lat);
    let strategyParam = '';
    if (travelMode.value === '公交') strategyParam = '&strategy=5';
    const url = `/amap/v3/direction/transit/integrated?origin=${ogcLng},${ogcLat}&destination=${dgcLng},${dgcLat}&city=370100${strategyParam}&key=f752ae50b3478617343635244aa5c843`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.status !== '1' || !data.route || !data.route.transits || !data.route.transits.length) {
          ElMessage.error('未查询到公交路线：' + (data.info || ''));
          return;
        }
        const route = data.route;
        const parseTransit = (transit) => {
          const coords = [];
          const busNames = [];
          const stops = [];
          const pushStop = (s) => {
            if (s && s.location) {
              const [lng, lat] = s.location.split(',').map(Number);
              const [wlng, wlat] = gcj2wgs(lng, lat);
              stops.push({ name: s.name, lng: wlng, lat: wlat });
            }
          };
          for (const seg of transit.segments) {
            if (seg.bus && seg.bus.buslines && seg.bus.buslines.length) {
              const bl = seg.bus.buslines[0];
              busNames.push(bl.type === '地铁线路' ? '🚇' + bl.name : bl.name);
              coords.push(...polyline2wgs(bl.polyline));
              pushStop(bl.departure_stop);
              (bl.via_stops || []).forEach(pushStop);
              pushStop(bl.arrival_stop);
            }
            if (seg.railway && (seg.railway.name || (seg.railway.lines && seg.railway.lines.length))) {
              const rw = seg.railway;
              const lineName = rw.name || (rw.lines && rw.lines[0] && rw.lines[0].name) || '地铁';
              busNames.push(lineName);
              if (rw.lines && rw.lines.length) rw.lines.forEach(line => { if (line.polyline) coords.push(...polyline2wgs(line.polyline)); });
              pushStop(rw.departure_stop);
              (rw.via_stops || []).forEach(pushStop);
              pushStop(rw.arrival_stop);
            }
          }
          return {
            coords, stops, busNames,
            duration: Math.round(transit.duration / 60),
            distance: Number(transit.distance || route.distance || 0),
            walk: Number(transit.walking_distance || 0),
            cost: transit.cost
          };
        };
        let transits = route.transits.slice(0, 5);
        if (travelMode.value === '地铁优先') {
          const hasMetro = (t) => t.segments && t.segments.some(s => s.bus && s.bus.buslines && s.bus.buslines.some(bl => bl.type === '地铁线路'));
          transits = transits.slice().sort((a, b) => (hasMetro(b) ? 1 : 0) - (hasMetro(a) ? 1 : 0));
        }
        const prefix = travelMode.value === '地铁优先' ? '地铁路线' : '公交方案';
        const alts = transits.map((tt, i) => {
          const q = parseTransit(tt);
          return {
            kind: 'transit', name: prefix + (i + 1),
            duration: q.duration, distance: q.distance,
            sub: '步行' + (q.walk / 1000).toFixed(1) + 'km · ' + (q.cost ? (q.cost + '元') : '免费') + ' · ' + (q.busNames.length ? q.busNames.join('、') : '步行直达'),
            coords: q.coords, stops: q.stops, busNames: q.busNames
          };
        }).filter(a => a.coords.length);
        if (!alts.length) { ElMessage.error('未解析到可用公交方案'); return; }
        tagAlts(alts);
        routeOD = { o, d };
        routeAlts.value = alts;
        selectedAlt.value = 0;
        drawRouteAlt(0);
        ElMessage.success('共查询到 ' + alts.length + ' 条公共交通方案，可在对话框切换');
        addHistory((originName.value || '起点') + ' → ' + (destName.value || '终点') + '（公共交通）', 'transit');
      })
      .catch(err => {
        console.error('路线查询失败:', err);
        ElMessage.error('路线查询失败：' + (err && err.message ? err.message : err));
      });
  };

  map.on('click', 'transit-route-line', () => { openRouteDetail(); });
  map.on('click', 'transit-route-points', (e) => {
    const f = e.features && e.features[0];
    if (!f) return;
    const [lng, lat] = f.geometry.coordinates;
    const kind = f.properties.kind;
    const label = kind === 'start' ? '起点' : kind === 'end' ? '终点' : f.properties.name;
    map.flyTo({ center: [lng, lat], zoom: 15, pitch: 40 });
    if (label) {
      new mapboxgl.Popup({ closeButton: false, offset: 15 })
        .setLngLat([lng, lat])
        .setHTML(`<div style="font-size:13px;font-weight:bold">${label}</div>`)
        .addTo(map);
    }
  });

  // 地图选点：统一处理（谁先触发谁处理，并立即清空 picking）
  const pickOnMap = (lng, lat) => {
    const which = ctx.picking.value;
    if (!which) return;
    const label = `${Number(lng).toFixed(5)}, ${Number(lat).toFixed(5)}`;
    if (which === 'report') {
      reportForm.value.lng = lng;
      reportForm.value.lat = lat;
      reverseGeocode(lng, lat);
      reportDialogVisible.value = true;
    } else if (which === 'poi') {
      poiCenter.value = { lng, lat, label };
      poiDialogVisible.value = true;
    } else if (which === 'origin') {
      originPicked.value = { lng, lat, label };
      transitVisible.value = true;
    } else {
      destPicked.value = { lng, lat, label };
      transitVisible.value = true;
    }
    ctx.picking.value = null;
  };
  map.on('click', (e) => { if (e.lngLat) pickOnMap(e.lngLat.lng, e.lngLat.lat); });
  scene.on('click', (e) => {
    if (!ctx.picking.value) return;
    const ll = e && e.lngLat;
    if (ll && ll.lng != null && ll.lat != null) pickOnMap(ll.lng, ll.lat);
  });

  const overviewRoute = () => {
    if (routeBounds.value) map.fitBounds(routeBounds.value, { padding: 80, duration: 1000 });
    transitVisible.value = false;
  };

  // ===== 车道级导航 =====
  const laneNavi = ref({ active: false, arrow: '↑', distance: '0m', road: '导航中', remainMin: 0, lanes: [] });

  const startLaneNavi = () => {
    transitVisible.value = false;
    const dist = routeInfo.value?.distance || 0;
    const dur = routeInfo.value?.duration || 0;
    const steps = routeInfo.value?.driveSteps || [];
    let arrow = 'straight';
    const firstStep = steps[0] || '';
    if (/掉头|调头/.test(firstStep)) arrow = 'uturn';
    else if (/右转|向右/.test(firstStep)) arrow = 'right';
    else if (/左转|向左/.test(firstStep)) arrow = 'left';
    const lanes = [
      { left: false, straight: true, right: false, rec: false },
      { left: true, straight: true, right: false, rec: true },
      { left: false, straight: true, right: true, rec: false }
    ];
    laneNavi.value = {
      active: true,
      arrow,
      distance: (dist / 1000).toFixed(1) + ' km',
      road: routeInfo.value?.description?.slice(0, 18) || '前方道路',
      remainMin: dur,
      lanes
    };
    if (currentRouteCoords && currentRouteCoords.length >= 2) {
      const start = currentRouteCoords[0];
      const next = currentRouteCoords[Math.min(10, currentRouteCoords.length - 1)];
      const dy = next[1] - start[1];
      const dx = next[0] - start[0];
      let bearing = Math.atan2(dx, dy) * 180 / Math.PI;
      if (bearing < 0) bearing += 360;
      map.flyTo({ center: start, zoom: 17, pitch: 65, bearing: bearing, duration: 1800 });
    } else if (routeBounds.value) {
      map.flyTo({ center: routeBounds.value[0], zoom: 16, pitch: 60, duration: 1500 });
    }
    drawLaneMarkings();
    ElMessage.success('车道级导航已启动');
  };

  function drawLaneMarkings() {
    ['lane-mark-1', 'lane-mark-2', 'lane-mark-3'].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
    if (map.getSource('lane-marks')) { map.removeSource('lane-marks'); }
    if (!currentRouteCoords || currentRouteCoords.length < 2) return;
    const lanes = [[0, 0.00008], [0, 0], [0, -0.00008]];
    const features = [];
    lanes.forEach((offset, idx) => {
      const coords = currentRouteCoords.map(p => [p[0] + offset[0], p[1] + offset[1]]);
      features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: { idx } });
    });
    map.addSource('lane-marks', { type: 'geojson', data: { type: 'FeatureCollection', features } });
    for (let i = 0; i < 3; i++) {
      map.addLayer({
        id: 'lane-mark-' + i, type: 'line', source: 'lane-marks',
        filter: ['==', ['get', 'idx'], i],
        paint: {
          'line-color': i === 1 ? '#ffffff' : 'rgba(255,255,255,0.5)',
          'line-width': i === 1 ? 3 : 2,
          'line-dasharray': i === 1 ? [2, 3] : [1, 2],
          'line-opacity': 0.9
        }
      });
    }
  }

  const exitLaneNavi = () => {
    laneNavi.value.active = false;
    ['lane-mark-1', 'lane-mark-2', 'lane-mark-3'].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
    if (map.getSource('lane-marks')) map.removeSource('lane-marks');
    ['transit-route-glow', 'transit-route-line', 'transit-route-points'].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
    if (map.getSource('transit-route')) map.removeSource('transit-route');
    routeInfo.value = null;
    map.flyTo({ bearing: 0, pitch: 0, zoom: map.getZoom() > 16 ? 12 : map.getZoom(), duration: 1000 });
    ElMessage.success('已退出导航');
  };

  // ===== 实时路况图层（高德交通态势） =====
  const trafficOn = ref(false);
  const trafficSummary = ref('');
  let trafficTimer = null;
  const TRAFFIC_SOURCE = 'jinan-traffic';
  const trafficStatusExpr = ['match', ['get', 'status'], 1, '#31c45a', 2, '#ffb300', 3, '#ff7043', '#e53935'];

  function ensureTrafficLayers() {
    if (!map.getSource(TRAFFIC_SOURCE)) {
      map.addSource(TRAFFIC_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    }
    if (!map.getLayer('jinan-traffic-glow')) {
      map.addLayer({ id: 'jinan-traffic-glow', type: 'line', source: TRAFFIC_SOURCE, paint: { 'line-width': 10, 'line-opacity': 0.22, 'line-blur': 4, 'line-color': trafficStatusExpr } });
    }
    if (!map.getLayer('jinan-traffic-line')) {
      map.addLayer({ id: 'jinan-traffic-line', type: 'line', source: TRAFFIC_SOURCE, paint: { 'line-width': 5, 'line-opacity': 0.95, 'line-color': trafficStatusExpr } });
    }
  }

  async function fetchTraffic() {
    if (!trafficOn.value) return;
    const c = map.getCenter();
    const [gcLng, gcLat] = wgs2gcj(c.lng, c.lat);
    const halfLng = 0.035, halfLat = 0.028;
    const rect = `${(gcLng - halfLng).toFixed(6)},${(gcLat - halfLat).toFixed(6)};${(gcLng + halfLng).toFixed(6)},${(gcLat + halfLat).toFixed(6)}`;
    const url = `/amap/v3/traffic/status/rectangle?rectangle=${rect}&level=5&extensions=all&key=f752ae50b3478617343635244aa5c843`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== '1') {
        ElMessage.warning('路况获取失败：' + (data.info || '') + '（' + (data.infocode || '') + '）');
        return;
      }
      const tinfo = data.trafficinfo || {};
      const roads = tinfo.roads || [];
      trafficSummary.value = tinfo.evaluation
        ? `当前区域：${tinfo.evaluation.description}　畅通 ${tinfo.evaluation.expedite} / 缓行拥堵 ${tinfo.evaluation.congested}`
        : '';
      if (tinfo.evaluation) upsertDynamicAnn('traffic', { type: 'traffic', priority: 'mid', title: '实时路况', content: trafficSummary.value });
      const features = [];
      roads.forEach(road => {
        if (!road.polyline) return;
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: polyline2wgs(road.polyline) },
          properties: { name: road.name, status: Number(road.status), direction: road.direction || '' }
        });
      });
      if (map.getSource(TRAFFIC_SOURCE)) {
        map.getSource(TRAFFIC_SOURCE).setData({ type: 'FeatureCollection', features });
      }
    } catch (err) {
      console.error('路况请求失败：', err);
    }
  }

  let trafficHoverPopup = null;
  let trafficHoverBinded = false;
  const TRAFFIC_STATUS_TEXT = { 1: '畅通', 2: '缓行', 3: '拥堵', 4: '严重拥堵' };
  const TRAFFIC_STATUS_COLOR = { 1: '#31c45a', 2: '#ffb300', 3: '#ff7043', 4: '#e53935' };
  function bindTrafficHover() {
    if (trafficHoverBinded) return;
    trafficHoverBinded = true;
    map.on('mousemove', (e) => {
      if (!trafficOn.value || !map.getLayer('jinan-traffic-line')) return;
      const f = map.queryRenderedFeatures(e.point, { layers: ['jinan-traffic-line'] })[0];
      if (f) {
        const st = f.properties.status;
        const color = TRAFFIC_STATUS_COLOR[st] || '#999';
        if (!trafficHoverPopup) trafficHoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
        trafficHoverPopup.setLngLat(e.lngLat).setHTML(
          `<div style="font-size:12px;line-height:1.7"><b>${f.properties.name || '道路'}</b><br/>状态：<b style="color:${color}">${TRAFFIC_STATUS_TEXT[st] || '未知'}</b>${f.properties.direction ? '<br/>' + f.properties.direction : ''}</div>`
        ).addTo(map);
        map.getCanvas().style.cursor = 'pointer';
      } else if (trafficHoverPopup) {
        trafficHoverPopup.remove();
        map.getCanvas().style.cursor = '';
      }
    });
  }

  function removeTrafficLayers() {
    ['jinan-traffic-line', 'jinan-traffic-glow'].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
    if (map.getSource(TRAFFIC_SOURCE)) map.removeSource(TRAFFIC_SOURCE);
  }

  const toggleTraffic = () => {
    if (trafficOn.value) {
      trafficOn.value = false;
      trafficSummary.value = '';
      removeDynamicAnn('traffic');
      if (trafficTimer) { clearInterval(trafficTimer); trafficTimer = null; }
      removeTrafficLayers();
      if (trafficHoverPopup) trafficHoverPopup.remove();
      ElMessage.success('已关闭实时路况');
    } else {
      trafficOn.value = true;
      ensureTrafficLayers();
      bindTrafficHover();
      fetchTraffic();
      trafficTimer = setInterval(fetchTraffic, 60000);
      upsertDynamicAnn('traffic', { type: 'traffic', priority: 'mid', title: '实时路况', content: '实时路况已开启，绿畅通/黄缓行/橙拥堵/红严重拥堵，每60秒刷新。' });
      ElMessage.success('实时路况已开启：绿畅通 / 黄缓行 / 橙拥堵 / 红严重拥堵，每60秒刷新');
    }
  };

  // ===== 交通事件上报 =====
  const EVENT_TYPES = [
    { value: 'accident', label: '交通事故', color: '#e53935', icon: '🚗', char: '事' },
    { value: 'construction', label: '道路施工', color: '#fb8c00', icon: '🚧', char: '工' },
    { value: 'congestion', label: '交通拥堵', color: '#f9a825', icon: '🐢', char: '堵' },
    { value: 'control', label: '交通管制', color: '#8e24aa', icon: '⛔', char: '管' }
  ];
  const eventTypeMap = Object.fromEntries(EVENT_TYPES.map(t => [t.value, t]));
  const reportDialogVisible = ref(false);
  const reportForm = ref({ type: 'accident', level: 2, address: '', description: '', lng: null, lat: null });
  const reportedEvents = ref([]);
  let reportEventsLayer = null;
  const eventDetail = ref(null);

  const startReport = () => {
    ctx.picking.value = 'report';
    ElMessage.info('请在地图上点击事件发生位置');
  };

  const reverseGeocode = (lng, lat) => {
    const [glng, glat] = wgs2gcj(lng, lat);
    fetch(`/amap/v3/geocode/regeo?location=${glng},${glat}&key=f752ae50b3478617343635244aa5c843`)
      .then(r => r.json())
      .then(d => { if (d.status === '1' && d.regeocode) reportForm.value.address = d.regeocode.formatted_address || ''; })
      .catch(() => {});
  };

  const resetReportForm = () => {
    reportForm.value = { type: 'accident', level: 2, address: '', description: '', lng: null, lat: null };
  };

  const submitReport = async () => {
    const f = reportForm.value;
    if (f.lng == null || f.lat == null) { ElMessage.warning('请先在地图上选择事件位置'); return; }
    let username = '匿名用户';
    try { username = localStorage.getItem('username') || '匿名用户'; } catch (e) {}
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: f.type, level: f.level, lng: f.lng, lat: f.lat, address: f.address, description: f.description, username })
      });
      const data = await res.json();
      if (data.code !== 0) { ElMessage.error(data.msg || '上报失败'); return; }
      ElMessage.success('交通事件上报成功');
      reportDialogVisible.value = false;
      resetReportForm();
      upsertDynamicAnn('event-' + (Date.now()), {
        type: 'event', priority: 'high', title: '新事件：' + (f.address || reportForm.value.address || '未知地点'),
        content: (EVENT_TYPES.find(t => t.value === f.type)?.label || '事件') + '，' + (f.description || '无描述') + '，上报人：' + username
      });
      loadReportedEvents();
    } catch (err) {
      ElMessage.error('上报失败：' + err.message);
    }
  };

  async function loadReportedEvents() {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.code !== 0) return;
      reportedEvents.value = data.data || [];
      renderReportedEvents();
    } catch (err) { console.error('事件列表加载失败：', err); }
  }

  function renderReportedEvents() {
    if (reportEventsLayer) { scene.removeLayer(reportEventsLayer); reportEventsLayer = null; }
    if (!reportedEvents.value.length) return;
    ensureMarkerImages();
    const features = reportedEvents.value.map(ev => {
      const t = eventTypeMap[ev.type] || {};
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [ev.lng, ev.lat] },
        properties: {
          lng: ev.lng, lat: ev.lat, id: ev.id, type: ev.type,
          typeLabel: t.label || '交通事件', iconChar: t.icon || '', color: t.color || '#e53935',
          level: Number(ev.level), address: ev.address || '未命名位置',
          description: ev.description || '', username: ev.username || '匿名',
          createdAt: ev.created_at || '', img: 'ev-' + ev.type
        }
      };
    });
    reportEventsLayer = new PointLayer({ zIndex: 6 })
      .source({ type: 'FeatureCollection', features })
      .shape('img', v => v)
      .size('level', l => 12 + Number(l) * 2);
    reportEventsLayer.on('mousemove', e => {
      const p = e.feature && e.feature.properties;
      if (!p) return;
      const levelText = ['', '一般', '较重', '严重'][p.level] || p.level;
      if (ctx.hoverPopup) scene.removePopup(ctx.hoverPopup);
      ctx.hoverPopup = new Popup({ offsets: [0, -14], closeButton: false, closeOnClick: false })
        .setLnglat(e.lngLat)
        .setHTML(`<div style="font-size:12px;line-height:1.7"><b style="color:${p.color}">${p.iconChar} ${p.typeLabel}</b><br/>${p.address}<br/>严重程度：${levelText}</div>`);
      scene.addPopup(ctx.hoverPopup);
    });
    reportEventsLayer.on('mouseout', () => {
      if (ctx.hoverPopup) { scene.removePopup(ctx.hoverPopup); ctx.hoverPopup = null; }
    });
    reportEventsLayer.on('click', e => {
      const p = e.feature && e.feature.properties;
      if (!p) return;
      if (ctx.hoverPopup) { scene.removePopup(ctx.hoverPopup); ctx.hoverPopup = null; }
      eventDetail.value = {
        id: p.id, typeLabel: p.typeLabel, iconChar: p.iconChar, color: p.color,
        levelText: ['', '一般', '较重', '严重'][p.level] || p.level,
        address: p.address, description: p.description, username: p.username,
        createdAt: p.createdAt ? formatTime(p.createdAt) : '', lng: p.lng, lat: p.lat
      };
      map.flyTo({ center: [p.lng, p.lat], zoom: 15, pitch: 30 });
    });
    scene.addLayer(reportEventsLayer);
  }

  const clearReportedEvents = () => {
    if (reportEventsLayer) { scene.removeLayer(reportEventsLayer); reportEventsLayer = null; }
    reportedEvents.value = [];
    eventDetail.value = null;
    if (ctx.popup) { scene.removePopup(ctx.popup); ctx.popup = null; }
    if (ctx.hoverPopup) { scene.removePopup(ctx.hoverPopup); ctx.hoverPopup = null; }
    ElMessage.success('已清除全部事件标点');
  };

  const removeOneEvent = (id) => {
    const before = reportedEvents.value.length;
    reportedEvents.value = reportedEvents.value.filter(ev => String(ev.id) !== String(id));
    if (reportedEvents.value.length === before) return;
    if (ctx.popup) { scene.removePopup(ctx.popup); ctx.popup = null; }
    renderReportedEvents();
    ElMessage.success('已移除该事件标点' + (reportedEvents.value.length ? '，剩余 ' + reportedEvents.value.length + ' 个' : '，已全部移除'));
  };

  const removeCurrentEvent = () => {
    if (!eventDetail.value) return;
    const id = eventDetail.value.id;
    eventDetail.value = null;
    removeOneEvent(id);
  };

  // ===== 驾车 / 步行路径规划 =====
  const routeAlts = ref([]);
  const selectedAlt = ref(0);
  let routeOD = null;

  const tagAlts = (alts) => {
    let minDur = 0, minDist = 0;
    alts.forEach((a, i) => {
      if (a.duration < alts[minDur].duration) minDur = i;
      if (Number(a.distance) < Number(alts[minDist].distance)) minDist = i;
    });
    alts.forEach((a, i) => {
      const tags = [];
      if (i === 0) tags.push('推荐');
      if (i === minDur && alts.length > 1) tags.push('用时最短');
      if (i === minDist && alts.length > 1 && i !== minDur) tags.push('距离最短');
      a.badge = tags.join('·');
    });
  };

  let currentRouteCoords = [];
  const paintRoute = (coords, stopPoints, lineColor, o, d) => {
    currentRouteCoords = coords;
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [o.lng, o.lat] }, properties: { kind: 'start' } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [d.lng, d.lat] }, properties: { kind: 'end' } },
        ...stopPoints.map(s => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [s.lng, s.lat] }, properties: { kind: 'stop', name: s.name } }))
      ]
    };
    if (map.getSource('transit-route')) map.getSource('transit-route').setData(geojson);
    else map.addSource('transit-route', { type: 'geojson', data: geojson });
    if (!map.getLayer('transit-route-glow')) {
      map.addLayer({ id: 'transit-route-glow', type: 'line', source: 'transit-route', paint: { 'line-color': lineColor, 'line-width': 14, 'line-opacity': 0.25, 'line-blur': 6 } });
    } else map.setPaintProperty('transit-route-glow', 'line-color', lineColor);
    if (!map.getLayer('transit-route-line')) {
      map.addLayer({ id: 'transit-route-line', type: 'line', source: 'transit-route', paint: { 'line-color': lineColor, 'line-width': 5, 'line-opacity': 1 } });
    } else map.setPaintProperty('transit-route-line', 'line-color', lineColor);
    if (!map.getLayer('transit-route-points')) {
      map.addLayer({
        id: 'transit-route-points', type: 'circle', source: 'transit-route', filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': ['match', ['get', 'kind'], 'start', 10, 'end', 10, 6],
          'circle-color': ['match', ['get', 'kind'], 'start', '#00ff88', 'end', '#ff3131', '#ffb300'],
          'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff'
        }
      });
    }
    ['transit-route-glow', 'transit-route-line', 'transit-route-points'].forEach(id => { if (map.getLayer(id)) map.moveLayer(id); });
  };

  const drawRouteAlt = (idx) => {
    const a = routeAlts.value[idx];
    if (!a || !routeOD) return;
    selectedAlt.value = idx;
    const { o, d } = routeOD;
    const mode = travelMode.value;
    const lineColor = a.kind === 'transit' ? '#00d4ff' : (mode === '驾车' ? '#ff9800' : '#4caf50');
    const coords = a.coords;
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    if (coords.length) routeBounds.value = [[minLng, minLat], [maxLng, maxLat]];
    if (a.kind === 'drive') {
      routeInfo.value = { duration: a.duration, distance: a.distance, description: mode + ' · ' + a.name, stops: [], driveSteps: a.steps, tfLevel: null, tfTime: null, traffic: a.traffic || [], tolls: a.tolls, lights: a.lights };
      paintRoute(coords, [], lineColor, o, d);
    } else {
      const idealMin = a.duration;
      let tf = 'fast';
      if (idealMin >= 40) tf = 'congestion';
      else if (idealMin >= 25) tf = 'slow';
      routeInfo.value = { duration: idealMin, distance: a.distance, description: a.busNames.join(' → ') || '步行直达', stops: a.stops.map(s => s.name), tfLevel: tf, tfTime: idealMin, traffic: [], busNames: a.busNames, walk: a.walk };
      paintRoute(coords, a.stops, lineColor, o, d);
    }
    map.flyTo({ center: [(o.lng + d.lng) / 2, (o.lat + d.lat) / 2], zoom: 13 });
  };

  const selectAlternative = (idx) => { if (idx !== selectedAlt.value) drawRouteAlt(idx); };

  const TRAFFIC_META = [
    { label: '畅通', color: '#2ecc71' },
    { label: '缓行', color: '#ffd54f' },
    { label: '拥堵', color: '#ff9800' },
    { label: '严重拥堵', color: '#ef5350' },
  ];
  function buildRouteDetail() {
    if (!routeInfo.value || !routeOD) return null;
    const a = routeAlts.value[selectedAlt.value];
    const info = routeInfo.value;
    let trafficStats = null;
    if (a && a.kind === 'drive' && a.traffic && a.traffic.length) {
      const byStatus = [0, 0, 0, 0]; let total = 0;
      a.traffic.forEach(t => { byStatus[t.status] = (byStatus[t.status] || 0) + t.length; total += t.length; });
      trafficStats = byStatus.map((len, i) => ({ status: i, label: TRAFFIC_META[i].label, color: TRAFFIC_META[i].color, length: Math.round(len), pct: total ? Math.round(len / total * 100) : 0 })).filter(x => x.length > 0);
      trafficStats.total = Math.round(total);
    }
    const schedules = [];
    if (a && a.kind === 'transit' && a.busNames && a.busNames.length) {
      for (const rawName of a.busNames) {
        const cleanName = String(rawName).replace(/^🚇/, '').trim();
        const sch = lineSchedule({ properties: { name: cleanName } });
        schedules.push({ name: rawName, ...sch });
      }
    }
    return {
      origin: originName.value || '起点', dest: destName.value || '终点', mode: travelMode.value,
      duration: info.duration, distance: info.distance, description: info.description,
      badge: a ? a.badge : '', walk: a && a.walk != null ? a.walk : null,
      tolls: a && a.tolls != null ? a.tolls : null, lights: a && a.lights != null ? a.lights : null,
      kind: a ? a.kind : '', trafficStats, tfLevel: info.tfLevel, tfTime: info.tfTime,
      schedules, stops: info.stops || [], driveSteps: info.driveSteps || []
    };
  }
  function openRouteDetail() {
    routeDetail.value = buildRouteDetail();
    if (routeDetail.value) routeDetailDialog.value = true;
  }

  const queryDriveOrWalk = (o, d) => {
    const mode = travelMode.value;
    const apiType = mode === '驾车' ? 'driving' : 'walking';
    const [ogcLng, ogcLat] = wgs2gcj(o.lng, o.lat);
    const [dgcLng, dgcLat] = wgs2gcj(d.lng, d.lat);
    routeOD = { o, d };
    const mkUrl = (st) => `/amap/v3/direction/${apiType}?origin=${ogcLng},${ogcLat}&destination=${dgcLng},${dgcLat}&extensions=all${st ? '&strategy=' + st : ''}&key=f752ae50b3478617343635244aa5c843`;
    const strategies = mode === '驾车' ? [[10, '推荐路线'], [35, '躲避拥堵'], [32, '距离优先'], [33, '不走高速']] : [[null, '步行路线']];
    Promise.all(strategies.map(([st, name]) => fetch(mkUrl(st)).then(r => r.json()).then(j => ({ j, name })).catch(() => null)))
      .then(list => {
        const alts = [];
        list.forEach(item => {
          if (!item) return;
          const j = item.j;
          if (j.status === '1' && j.route && j.route.paths && j.route.paths[0]) {
            const path0 = j.route.paths[0];
            const coords = [];
            const steps = [];
            (path0.steps || []).forEach(stp => { if (stp.polyline) coords.push(...polyline2wgs(stp.polyline)); steps.push(stp.instruction || ''); });
            const traffic = (path0.tmcs || []).map(t => ({ length: Number(t.length || 0), status: Number(t.status || 0) }));
            const a = {
              kind: 'drive', name: item.name,
              duration: Math.round(path0.duration / 60), distance: Number(path0.distance),
              tolls: Number(path0.tolls || 0),
              lights: path0.traffic_lights != null && path0.traffic_lights !== '' ? Number(path0.traffic_lights) : null,
              coords, steps, traffic
            };
            const dup = alts.some(x => Math.abs(x.distance - a.distance) < 60 && Math.abs(x.duration - a.duration) <= 1);
            if (!dup) alts.push(a);
          }
        });
        if (!alts.length) { ElMessage.error('未查询到' + mode + '路线'); return; }
        tagAlts(alts);
        routeAlts.value = alts;
        selectedAlt.value = 0;
        drawRouteAlt(0);
        if (alts.length > 1) ElMessage.success('共查询到 ' + alts.length + ' 条' + mode + '方案，可在对话框切换');
        addHistory((originName.value || '起点') + ' → ' + (destName.value || '终点') + '（' + mode + '）', mode === '驾车' ? 'drive' : 'walk');
      })
      .catch(err => {
        console.error(mode + '路线查询失败：', err);
        ElMessage.error(mode + '路线查询失败：' + (err && err.message ? err.message : err));
      });
  };

  // ===== 周边设施 POI 检索 =====
  const POI_CATEGORIES = [
    { label: '停车场', types: '150900', icon: '🅿️', char: '停', color: '#1e88e5' },
    { label: '加油站', types: '010100', icon: '⛽', char: '油', color: '#ef5350' },
    { label: '公共厕所', types: '200300', icon: '🚻', char: '厕', color: '#00acc1' },
    { label: '医院', types: '090100', icon: '🏥', char: '医', color: '#ec407a' },
    { label: '学校', types: '141200', icon: '🏫', char: '校', color: '#43a047' },
    { label: '商场', types: '060100', icon: '🏬', char: '商', color: '#8e24aa' },
    { label: '公交站', types: '150700', icon: '🚌', char: '公', color: '#fb8c00' },
    { label: '地铁站', types: '150500', icon: '🚇', char: '地', color: '#3949ab' }
  ];
  const makeBadgeSVG = (color, text, textColor) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="15" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
      <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1"/>
      <text x="20" y="26" font-size="17" font-family="Microsoft YaHei,PingFang SC,sans-serif" font-weight="bold" fill="${textColor || '#ffffff'}" text-anchor="middle">${text}</text>
    </svg>`;
  let markerImagesReady = false;
  function ensureMarkerImages() {
    if (markerImagesReady) return;
    const add = (id, color, text, tc) => { if (!scene.hasImage(id)) scene.addImage(id, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(makeBadgeSVG(color, text, tc))); };
    EVENT_TYPES.forEach(t => add('ev-' + t.value, t.color, t.char, t.value === 'congestion' ? '#4e3500' : '#ffffff'));
    POI_CATEGORIES.forEach(c => add('poi-' + c.types, c.color, c.char));
    markerImagesReady = true;
  }
  const poiDialogVisible = ref(false);
  const poiCategory = ref('150900');
  const poiRadius = ref(1000);
  const poiCenter = ref(null);
  const poiList = ref([]);
  let poiLayer = null;

  const startPickPoiCenter = () => {
    poiDialogVisible.value = false;
    ctx.picking.value = 'poi';
    ElMessage.info('请在地图上点击检索中心');
  };

  const queryPoi = async () => {
    if (!poiCenter.value) { ElMessage.warning('请先在地图上选择检索中心'); return; }
    const [glng, glat] = wgs2gcj(poiCenter.value.lng, poiCenter.value.lat);
    const url = `/amap/v3/place/around?location=${glng},${glat}&radius=${poiRadius.value}&types=${poiCategory.value}&offset=30&page=1&extensions=all&key=f752ae50b3478617343635244aa5c843`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== '1') { ElMessage.error('检索失败：' + (data.info || '')); return; }
      const pois = data.pois || [];
      const cat = POI_CATEGORIES.find(c => c.types === poiCategory.value) || {};
      poiList.value = pois.filter(p => p.location).map(p => {
        const [lng, lat] = p.location.split(',').map(Number);
        const [wlng, wlat] = gcj2wgs(lng, lat);
        return {
          name: p.name, lng: wlng, lat: wlat,
          address: p.address || ((p.pname || '') + (p.cityname || '') + (p.adname || '')),
          distance: p.distance,
          tel: Array.isArray(p.tel) ? p.tel.join('、') : (p.tel || ''),
          img: 'poi-' + poiCategory.value, catLabel: cat.label || '', color: cat.color || '#00e5ff'
        };
      });
      selectedPoiIndex.value = -1;
      renderPoiLayer();
      if (!poiList.value.length) ElMessage.info('该范围内未找到相关设施，可尝试增大半径');
      else ElMessage.success(`检索到 ${poiList.value.length} 个设施`);
    } catch (err) {
      ElMessage.error('检索失败：' + err.message);
    }
  };

  function renderPoiLayer() {
    if (poiLayer) { scene.removeLayer(poiLayer); poiLayer = null; }
    if (!poiList.value.length) return;
    ensureMarkerImages();
    const poiFeatures = poiList.value.map(it => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [it.lng, it.lat] },
      properties: { ...it }
    }));
    poiLayer = new PointLayer({
      zIndex: 6, minZoom: 13, cluster: true,
      clusterOption: { radius: 55, maxZoom: 15, style: { fill: 'rgba(255, 152, 0, 0.85)', stroke: '#ffffff', strokeWidth: 2 } }
    })
      .source({ type: 'FeatureCollection', features: poiFeatures })
      .shape('img', v => v)
      .size(16);
    poiLayer.on('mousemove', e => {
      const p = e.feature && e.feature.properties;
      if (!p || p.cluster) return;
      if (ctx.hoverPopup) scene.removePopup(ctx.hoverPopup);
      ctx.hoverPopup = new Popup({ offsets: [0, -12], closeButton: false, closeOnClick: false })
        .setLnglat(e.lngLat)
        .setHTML(`<div style="font-size:12px;line-height:1.7"><b style="color:${p.color || '#00e5ff'}">${p.name}</b><br/>${p.catLabel || ''} · 距中心 ${p.distance} 米</div>`);
      scene.addPopup(ctx.hoverPopup);
    });
    poiLayer.on('mouseout', () => {
      if (ctx.hoverPopup) { scene.removePopup(ctx.hoverPopup); ctx.hoverPopup = null; }
    });
    poiLayer.on('click', e => {
      const p = e.feature && e.feature.properties;
      if (!p) return;
      if (p.cluster) {
        map.flyTo({ center: e.lngLat, zoom: Math.min((map.getZoom() || 10) + 2, 16) });
        return;
      }
      if (ctx.popup) scene.removePopup(ctx.popup);
      if (ctx.hoverPopup) { scene.removePopup(ctx.hoverPopup); ctx.hoverPopup = null; }
      ctx.popup = new Popup({ closeButton: true, closeOnClick: true })
        .setLnglat([p.lng, p.lat])
        .setHTML(`<div style="font-size:13px;line-height:1.8;min-width:160px">
          <b style="color:${p.color || '#00e5ff'};font-size:14px">${p.catLabel ? '[' + p.catLabel + '] ' : ''}${p.name}</b><br/>
          地址：${p.address || '—'}<br/>
          距检索中心：${p.distance} 米
          ${p.tel && p.tel !== '[]' ? '<br/>联系电话：' + p.tel : ''}
        </div>`);
      scene.addPopup(ctx.popup);
    });
    poiLayer.on('dblclick', e => {
      const p = e.feature && e.feature.properties;
      if (!p) return;
      planRouteToPoi(p);
    });
    scene.addLayer(poiLayer);
    if (poiCenter.value) map.flyTo({ center: [poiCenter.value.lng, poiCenter.value.lat], zoom: 14 });
  }

  const selectedPoiIndex = ref(-1);
  const flyToPoi = (row) => { map.flyTo({ center: [row.lng, row.lat], zoom: 16, pitch: 30 }); };
  const selectPoi = (row, i) => { selectedPoiIndex.value = i; flyToPoi(row); };

  const planRouteToPoi = (p) => {
    poiDialogVisible.value = false;
    destPicked.value = { lng: p.lng, lat: p.lat, label: p.name };
    destName.value = p.name;
    if (!originPicked.value) {
      originName.value = '泉城广场';
      ElMessage.info('以「泉城广场」为起点规划到「' + p.name + '」的驾车路线，可在对话框更换起点或出行方式');
    } else {
      ElMessage.success('已规划到「' + p.name + '」的驾车路线');
    }
    travelMode.value = '驾车';
    transitVisible.value = true;
    queryTransit();
  };

  const closePoi = () => {
    if (poiLayer) { scene.removeLayer(poiLayer); poiLayer = null; }
    poiList.value = [];
    selectedPoiIndex.value = -1;
    poiDialogVisible.value = false;
  };

  const trafficText = (level) => {
    const m = { fast: '畅通', slow: '缓行', congestion: '拥堵' };
    return m[level] || '未知';
  };

  // ===== 收藏当前路线 / 历史回放 / 收藏应用 =====
  const favCurrentRoute = () => {
    if (!routeInfo.value) { ElMessage.info('请先规划一条路线'); return; }
    const name = (originName.value || '起点') + ' → ' + (destName.value || '终点') + '（' + travelMode.value + '，约' + routeInfo.value.duration + '分钟）';
    addFavorite(name, 'route');
  };

  const replayByName = async (nameStr) => {
    const m = (nameStr || '').match(/^(.+?)\s*→\s*(.+?)（(.+?)[，,]/);
    if (!m) { ElMessage.warning('该记录缺少起终点信息'); return; }
    const oname = m[1].trim(), dname = m[2].trim(), mode = m[3].trim();
    originName.value = oname; destName.value = dname;
    travelMode.value = ['综合', '地铁优先', '公交', '驾车', '步行'].includes(mode) ? mode : '综合';
    originPicked.value = null; destPicked.value = null;
    transitVisible.value = true;
    const findLM = (n) => landmarks.find(l => l.name === n);
    const geo = async (name) => {
      const u = '/amap/v3/geocode/geo?address=' + encodeURIComponent(name) + '&city=370100&key=f752ae50b3478617343635244aa5c843';
      try {
        const j = await (await fetch(u)).json();
        if (j.status === '1' && j.geocodes && j.geocodes[0]) {
          const [lng, lat] = j.geocodes[0].location.split(',').map(Number);
          const [wLng, wLat] = gcj2wgs(lng, lat);
          return { lng: wLng, lat: wLat };
        }
      } catch (e) {}
      return null;
    };
    let o = findLM(oname), d = findLM(dname);
    if (!o) o = await geo(oname);
    if (!d) d = await geo(dname);
    if (!o || !d) { ElMessage.warning('该路线起终点已无法定位，请重新规划'); return; }
    originPicked.value = findLM(oname) ? null : o;
    destPicked.value = findLM(dname) ? null : d;
    queryTransit();
    ElMessage.success('已载入路线：' + oname + ' → ' + dname);
  };

  const applyFavorite = (f) => {
    favDialog.value = false;
    if (f.type === 'stop') {
      const st = findStopByName(f.name);
      if (st) map.flyTo({ center: [st.properties.lng, st.properties.lat], zoom: 15 });
      return;
    }
    replayByName(f.name);
  };

  return {
    landmarks, transitVisible, originName, destName, travelMode, routeInfo,
    routeDetailDialog, routeDetail, routeBounds, originPicked, destPicked,
    startPick, queryTransit, overviewRoute,
    laneNavi, startLaneNavi, exitLaneNavi,
    trafficOn, trafficSummary, toggleTraffic, fetchTraffic,
    EVENT_TYPES, reportDialogVisible, reportForm, reportedEvents, eventDetail,
    startReport, submitReport, loadReportedEvents, clearReportedEvents, removeCurrentEvent,
    routeAlts, selectedAlt, selectAlternative,
    POI_CATEGORIES, poiDialogVisible, poiCategory, poiRadius, poiCenter, poiList,
    startPickPoiCenter, queryPoi, selectPoi, planRouteToPoi, closePoi, selectedPoiIndex,
    trafficText, favCurrentRoute, replayByName, applyFavorite,
  }
}
