// 基于 Mapbox 自带建筑矢量数据挤出真实 3D 建筑
export function add3DBuildings(map) {
  try {
    if (map.getLayer('3d-buildings')) map.removeLayer('3d-buildings');
    map.addLayer({
      id: '3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 13,
      paint: {
        // 高科技霓虹配色：深蓝 -> 青蓝渐变，暗色底图上像未来城市
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['get', 'height'],
          0, '#16324f',
          30, '#1d4e7a',
          60, '#2575a8',
          100, '#37a3d4',
        ],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.9,
        // 垂直渐变，让建筑立面有明暗过渡
        'fill-extrusion-vertical-gradient': true,
      },
    });
  } catch (e) {
    // 某些样式（如卫星图）没有建筑矢量数据，忽略
  }
}

// 将地名标签汉化（Mapbox 默认优先英文名，这里改为优先中文）
export function setChineseLabels(map) {
  try {
    const zh = ['coalesce', ['get', 'name_zh-Hans'], ['get', 'name_zh'], ['get', 'name']];
    const layers = map.getStyle().layers;
    for (const layer of layers) {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        const sl = layer['source-layer'] || '';
        if (sl.includes('label')) {
          map.setLayoutProperty(layer.id, 'text-field', zh);
        }
      }
    }
  } catch (e) {
    // 忽略
  }
}
