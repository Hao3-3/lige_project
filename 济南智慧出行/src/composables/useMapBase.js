// ============================================================
// useMapBase.js —— 地图基础与公共交互（邵智昊 负责）
// 功能：
//   1) 地图自转 / 飞行济南 / 底部工具栏拖动 / 控制中心
//   2) 图层控制面板（公交/地铁子层开关）
//   3) 县区规划（区县边界 + 区县内事件点查询）
//   4) 济南等高线
//   5) 天气查看
//   6) 线路悬停/点击弹窗（公交、地铁线路通用交互）
// 依赖：useShared（公共单例 + 工具）
// ============================================================
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { LineLayer, PointLayer, Popup } from '@antv/l7'
import mapboxgl from 'mapbox-gl'
import countyLineData from '../../GIS_DATA/Jinan_line.json'
import livepointsData from '../../GIS_DATA/Jinan_livepoints.json'
import highlineData from '../../GIS_DATA/Jinan_highline.json'

export function useMapBase(shared, { emit }) {
  const { scene, map, ctx, linePopupHTML } = shared

  // ---------- 地图自转 ----------
  const isRotate = ref(true);
  const mark = computed(() => (isRotate.value ? '停止自转' : '开启自转'));
  const rotate = () => {
    let zoom = map.getZoom();
    if (zoom < 5) {
      let center = map.getCenter();
      center.lng += 10;
      map.easeTo({ center, duration: 1000, easing: (n) => n });
    }
  };
  const toggleRotate = () => {
    isRotate.value = !isRotate.value;
    if (!isRotate.value) map.stop();
    else rotate();
  };

  // ---------- 底部功能栏拖动 ----------
  const footerBottom = ref(0);
  let footerDragState = null;
  const onFooterMouseDown = (e) => {
    if (e.target.closest('.item')) return;
    footerDragState = { startY: e.clientY, startBottom: footerBottom.value };
    document.addEventListener('mousemove', onFooterMouseMove);
    document.addEventListener('mouseup', onFooterMouseUp);
    e.preventDefault();
  };
  const onFooterMouseMove = (e) => {
    if (!footerDragState) return;
    const dy = e.clientY - footerDragState.startY;
    footerBottom.value = Math.max(0, Math.min(window.innerHeight - 100, footerDragState.startBottom - dy));
  };
  const onFooterMouseUp = () => {
    footerDragState = null;
    document.removeEventListener('mousemove', onFooterMouseMove);
    document.removeEventListener('mouseup', onFooterMouseUp);
  };

  // ---------- 控制中心（通知父组件显隐 G2 图表） ----------
  const g2Visible = ref(true);
  const controlCenter = () => {
    g2Visible.value = !g2Visible.value;
    emit('controlCenter', g2Visible.value);
  };

  // ---------- 飞行济南 ----------
  const isInJinan = ref(false);
  const flyJinan = () => {
    if (isInJinan.value) {
      map.flyTo({ center: [117.02, 36.65], zoom: 1 });
    } else {
      map.flyTo({ center: [117.02, 36.65], zoom: 14, pitch: 45, bearing: 20 });
    }
    isInJinan.value = !isInJinan.value;
  };

  const trigger = () => { console.log('trigger'); };

  const funcItems = [
    { title: '', icon: 'icon-fuwudiqiu', trigger: toggleRotate },
    { title: '控制中心', icon: 'icon-supervision-full', trigger: controlCenter },
    { title: '飞行济南', icon: 'icon-icon-test', trigger: flyJinan },
    { title: '范围查询', icon: 'icon-paint', trigger: trigger },
    { title: '地图测量', icon: 'icon-ruler', trigger: trigger },
  ].reverse();

  // ---------- 图层控制面板 ----------
  const layerPanelVisible = ref(false);

  // ---------- 县区规划：区县边界 + 区县内事件点 ----------
  let isex = ref(false);
  let layer2 = null;
  const countyEvents = ref([]);
  const countyEventsVisible = ref(false);
  let countyEventLayer = null;

  const queryCountyEvents = (countyName) => {
    if (countyEventLayer) { scene.removeLayer(countyEventLayer); countyEventLayer = null; }
    const list = livepointsData.features.filter(f => f.properties.area === countyName);
    if (list.length) {
      countyEventLayer = new PointLayer({ zIndex: 5 })
        .source(list.map(f => ({
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
          name: f.properties.name,
          level: f.properties.level,
        })), { parser: { type: 'json', x: 'lng', y: 'lat' } })
        .shape('circle')
        .size(9)
        .color('#ff4d4f')
        .style({ stroke: '#ffffff', strokeWidth: 1.5, opacity: 0.95 });
      scene.addLayer(countyEventLayer);
    }
    countyEvents.value = list;
    countyEventsVisible.value = list.length > 0;
    return list.length;
  };

  const clearCountyEvents = () => {
    if (countyEventLayer) { scene.removeLayer(countyEventLayer); countyEventLayer = null; }
    countyEvents.value = [];
    countyEventsVisible.value = false;
  };

  const addll = () => {
    if (!isex.value) {
      layer2 = new LineLayer({ zIndex: 2 })
        .source(countyLineData)
        .color('#ffffff')
        .active({ color: '#ffd700' })
        .size(2)
        .style({ lineType: 'solid' });
      scene.addLayer(layer2);
      layer2.on('mousemove', e => {
        map.getCanvas().style.cursor = 'pointer';
        if (ctx.popup) { scene.removePopup(ctx.popup); }
        ctx.popup = new Popup({ offsets: [0, 0], closeButton: true, closeOnClick: true })
          .setLnglat(e.lngLat)
          .setHTML(`<span>${e.feature.properties.name}</span>`);
        scene.addPopup(ctx.popup);
      });
      layer2.on('mouseout', () => {
        map.getCanvas().style.cursor = '';
        if (ctx.popup) { scene.removePopup(ctx.popup); ctx.popup = null; }
      });
      layer2.on('click', e => {
        const p = e.feature.properties;
        if (ctx.popup) { scene.removePopup(ctx.popup); }
        const count = queryCountyEvents(p.name);
        ctx.popup = new Popup({ offsets: [0, 0], closeButton: true, closeOnClick: true })
          .setLnglat(e.lngLat)
          .setHTML(`<div style="font-size:13px;line-height:1.8">
            <b style="color:#ffd700">🏙 ${p.name}</b><br/>
            宜居评价：最佳 ${p['最佳适宜']} · 比较 ${p['比较适宜']} · 适宜 ${p['适宜']}<br/>
            区内事件点：<b style="color:#ff4d4f">${count}</b> 个
          </div>`);
        scene.addPopup(ctx.popup);
        if (count > 0) ElMessage.success(`「${p.name}」内共有 ${count} 个事件点，已在地图右侧列出`);
        else ElMessage.info(`「${p.name}」暂无事件数据`);
      });
      isex.value = !isex.value;
    } else {
      scene.removeLayer(layer2);
      clearCountyEvents();
      if (ctx.popup) { scene.removePopup(ctx.popup); ctx.popup = null; }
      isex.value = !isex.value;
    }
  };

  // ---------- 线路悬停/点击弹窗（公交、地铁通用） ----------
  let lineHoverPopup = null;
  const closeLineHover = () => { if (lineHoverPopup) { lineHoverPopup.remove(); lineHoverPopup = null; } };
  const LINE_LAYERS = ['bus-lines', 'metro-lines'];
  function queryLineAt(e) {
    if (typeof map.queryRenderedFeatures !== 'function') return null;
    const existing = LINE_LAYERS.filter((id) => !!map.getLayer(id));
    if (!existing.length) return null;
    let features;
    try {
      features = map.queryRenderedFeatures(e.point, { layers: existing });
    } catch (err) {
      return null;
    }
    return (features && features[0]) || null;
  }
  const flyPopupToStation = (el) => {
    const target = el && el.closest && el.closest('.jinan-station');
    if (!target || !map || typeof map.easeTo !== 'function') return;
    const lng = parseFloat(target.getAttribute('data-lng'));
    const lat = parseFloat(target.getAttribute('data-lat'));
    if (Number.isNaN(lng) || Number.isNaN(lat)) return;
    const name = (target.textContent || '').trim();
    map.easeTo({ center: [lng, lat], zoom: 15, pitch: 45, duration: 1800 });
    closeLineHover();
    if (name) ElMessage.success(`正在飞往站点：${name}`);
  };
  document.addEventListener('click', (e) => flyPopupToStation(e.target));
  document.addEventListener('mousemove', (e) => {
    const t = e.target;
    const isStation = !!(t && t.closest && t.closest('.jinan-station'));
    if (map && map.getCanvas()) map.getCanvas().style.cursor = isStation ? 'pointer' : '';
  });

  map.on('mousemove', (e) => {
    if (!e.point) return;
    const f = queryLineAt(e);
    if (!f) {
      map.getCanvas().style.cursor = '';
      closeLineHover();
      return;
    }
    map.getCanvas().style.cursor = 'pointer';
    if (lineHoverPopup) lineHoverPopup.setLngLat(e.lngLat).setHTML(linePopupHTML(f.properties));
    else lineHoverPopup = new mapboxgl.Popup({ closeButton: false, offset: 10, className: 'flow-popup' })
      .setLngLat(e.lngLat).setHTML(linePopupHTML(f.properties)).addTo(map);
  });

  map.on('click', (e) => {
    if (ctx.picking.value) return;
    if (!e.point) return;
    const f = queryLineAt(e);
    if (!f) return;
    closeLineHover();
    new mapboxgl.Popup({ closeButton: true, offset: 10, className: 'flow-popup' })
      .setLngLat(e.lngLat)
      .setHTML(linePopupHTML(f.properties))
      .addTo(map);
  });

  // ---------- 济南等高线 ----------
  let highline = null;
  let highlineex = true;
  const closePopup = () => { if (ctx.popup) { scene.removePopup(ctx.popup); ctx.popup = null; } };

  const ensureHighlineLayer = () => {
    if (highline) return highline;
    highline = new LineLayer({ zIndex: 1, name: 'jinan-highline' })
      .source(highlineData)
      .size('Contour', h => { return [h % 100 === 0 ? 1.0 : 0.5, h / 6]; })
      .shape('line')
      .scale('Contour', { type: 'quantize' })
      .style({ heightfixed: 'true' })
      .color('Contour', ['#094D4A', '#146968', '#1D7F7E', '#289899', '#34B6B7', '#4AC5AF', '#5FD3A6', '#7BE39E', '#A1EDB8', '#CEF8D6']);
    highline.on('mousemove', e => {
      const p = e.feature.properties;
      map.getCanvas().style.cursor = 'pointer';
      closePopup();
      ctx.popup = new Popup({ offsets: [0, 0], closeButton: false, closeOnClick: true })
        .setLnglat(e.lngLat)
        .setHTML(`<div style="font-size:13px;line-height:1.5"><b style="color:#34d399">⛰ 等高线</b><br/>海拔 <b>${p.Contour}</b> 米</div>`);
      scene.addPopup(ctx.popup);
    });
    highline.on('mouseout', () => { map.getCanvas().style.cursor = ''; closePopup(); });
    highline.on('click', e => {
      const p = e.feature.properties;
      closePopup();
      ctx.popup = new Popup({ offsets: [0, 0], closeButton: true, closeOnClick: true })
        .setLnglat(e.lngLat)
        .setHTML(`<div style="font-size:13px;line-height:1.8"><b style="color:#34d399">⛰ 等高线详情</b><br/>海拔：<b>${p.Contour}</b> 米<br/>类型：${p.Contour % 100 === 0 ? '计曲线（加粗线）' : '首曲线'}<br/>编号：${p.Id}</div>`);
      scene.addPopup(ctx.popup);
    });
    return highline;
  };

  const addhighline = () => {
    if (highlineex) {
      highlineex = !highlineex;
      scene.addLayer(ensureHighlineLayer());
    } else {
      highlineex = !highlineex;
      scene.removeLayer(highline);
      closePopup();
    }
  };

  // ---------- 天气查看 ----------
  let wztemperature, wzwinddirection, wzweather, wzwindpower, wzhumidity;
  const iswv = ref(0);
  fetch('/amap/v3/weather/weatherInfo?city=370100&key=f752ae50b3478617343635244aa5c843')
    .then(res => res.json())
    .then(data => {
      let { weather } = data.lives[0];
      let { winddirection } = data.lives[0];
      let { windpower } = data.lives[0];
      let { temperature } = data.lives[0];
      let { humidity } = data.lives[0];
      wzweather = { weather }.weather;
      wztemperature = { temperature }.temperature;
      wzwindpower = { windpower }.windpower;
      wzwinddirection = { winddirection }.winddirection;
      wzhumidity = { humidity }.humidity;
    });
  const addweather = () => {
    ElMessage({
      duration: 10000,
      customClass: 'tianqi',
      message: `济南天气:` + wzweather + `   气温:` + wztemperature + `℃` + `   风级:` + wzwindpower + `   风向:` + wzwinddirection + `   宜居指数:` + wzhumidity,
      type: 'message',
    });
  };

  return {
    isRotate, mark, rotate, toggleRotate,
    footerBottom, onFooterMouseDown,
    g2Visible, controlCenter,
    isInJinan, flyJinan,
    trigger, funcItems,
    layerPanelVisible,
    isex, countyEvents, countyEventsVisible, queryCountyEvents, clearCountyEvents, addll,
    addhighline, addweather,
    iswv,
  }
}
