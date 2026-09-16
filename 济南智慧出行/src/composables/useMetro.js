// ============================================================
// useMetro.js —— 地铁系统（比拉力 负责）
// 功能：
//   1) 地铁线路（Mapbox 原生图层，含光晕 + 置顶）
//   2) 地铁站点图标（L7，聚合，点击定位）
// 依赖：useShared（公共单例 + 线路几何工具）
// ============================================================
import { ref } from 'vue'
import { PointLayer, Popup } from '@antv/l7'
import metroLinesData from '../../GIS_DATA/Jinan_metro_lines.json'
import metroStopsData from '../../GIS_DATA/Jinan_metro_stations.json'

export function useMetro(shared) {
  const { scene, map, ctx, buildLinesGeoJSON } = shared

  // ---------- 地铁站点图标图层 ----------
  let metroStopLayer;
  let metroex = ref(false);
  const metroShowLines = ref(true);
  const metroShowStops = ref(false);
  const METRO_STOP_NAME = 'jinan-metro-stops';

  function ensureMetroStopLayer() {
    if (metroStopLayer) return metroStopLayer;
    if (!scene.hasImage('metro-stop-icon')) {
      scene.addImage('metro-stop-icon', 'data:image/png;base64,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');
    }
    metroStopLayer = new PointLayer({
      zIndex: 3, name: METRO_STOP_NAME,
      minZoom: 12, maxZoom: 20,
      cluster: true,
      clusterOption: {
        radius: 50, maxZoom: 14,
        style: { fill: 'rgba(120, 70, 220, 0.85)', stroke: '#ffffff', strokeWidth: 2 },
      }
    })
      .source(metroStopsData)
      .shape('img', () => 'metro-stop-icon')
      .size(10);
    metroStopLayer.on('click', e => {
      const p = e.feature.properties;
      if (p && p.cluster) {
        map.flyTo({ center: e.lngLat, zoom: Math.min((map.getZoom() || 10) + 2, 16) });
        return;
      }
      map.flyTo({ center: [p.lng, p.lat], zoom: 15, pitch: 30 });
      ctx.popup = new Popup({ closeButton: true, closeOnClick: true })
        .setLnglat([p.lng, p.lat])
        .setHTML(`<span>${p.name}（地铁站）</span>`);
      scene.addPopup(ctx.popup);
    });
    return metroStopLayer;
  }

  function syncMetroLayer() {
    if (metroStopLayer) { scene.removeLayer(metroStopLayer); metroStopLayer = null; }
    if (metroShowStops.value) scene.addLayer(ensureMetroStopLayer());
    if (metroShowLines.value) addMetroLines();
    else removeMetroLines();
    metroex.value = !!(metroShowLines.value || metroShowStops.value);
  }

  const addmetro = () => {
    if (metroex.value) {
      metroShowLines.value = false;
      metroShowStops.value = false;
      if (metroStopLayer) { scene.removeLayer(metroStopLayer); metroStopLayer = null; }
      removeMetroLines();
      metroex.value = false;
    } else {
      metroShowLines.value = true;
      metroShowStops.value = false;
      syncMetroLayer();
      metroex.value = true;
    }
  };

  // ---------- 地铁线路（Mapbox 原生图层，光晕 + 置顶） ----------
  function addMetroLines() {
    const geojson = buildLinesGeoJSON(metroLinesData.features, 'metro');
    if (!map.getSource('metro-lines')) map.addSource('metro-lines', { type: 'geojson', data: geojson });
    else map.getSource('metro-lines').setData(geojson);
    if (!map.getLayer('metro-lines-glow')) {
      map.addLayer({
        id: 'metro-lines-glow', type: 'line', source: 'metro-lines',
        paint: { 'line-color': ['get', 'color'], 'line-width': 11, 'line-opacity': 0.28, 'line-blur': 2 },
      });
    }
    if (!map.getLayer('metro-lines')) {
      map.addLayer({
        id: 'metro-lines', type: 'line', source: 'metro-lines',
        paint: { 'line-color': ['get', 'color'], 'line-width': 5, 'line-opacity': 0.95 },
      });
    }
    if (map.getLayer('bus-lines')) {
      map.moveLayer('metro-lines-glow');
      map.moveLayer('metro-lines');
    }
  }
  function removeMetroLines() {
    if (map.getLayer('metro-lines')) map.removeLayer('metro-lines');
    if (map.getLayer('metro-lines-glow')) map.removeLayer('metro-lines-glow');
    if (map.getSource('metro-lines')) map.removeSource('metro-lines');
  }

  return {
    metroex, metroShowLines, metroShowStops, syncMetroLayer, addmetro,
    addMetroLines, removeMetroLines,
  }
}
