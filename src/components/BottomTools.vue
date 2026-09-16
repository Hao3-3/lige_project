<template>
<!--   <div class="weather-content" v-show="iswv">
    济南天气：{{ wzweather }}
    <pre>  </pre>
    气温：{{ wztemperature }}℃
    <pre>  </pre>
    风级：{{ wzwindpower }}
    <pre>  </pre>
    风向：{{ wzwinddirection }}
  </div>-->
  <div class="footer" :style="{ bottom: footerBottom + 'px' }" @mousedown="onFooterMouseDown">
    <!--      <div class="item" v-for="(item, index) in funcItems">
        <button class="item-btn" @click="item.trigger">
          <i :class="['iconfont', item.icon]"></i>
        </button>
        <p>{{ index === funcItems.length - 1 ? mark : item.title }}</p>
      </div> -->
    <div class="item">

      <button class="item-btn" @click="addhighline">
        <i :class="['iconfont', 'icon-drawCircleTool']"></i>
      </button>

      <p>济南等高</p>
    </div>



    <div class="item">

      <button class="item-btn" @click="addweather">
        <img src="../assets/denggao.png"   style='width:17px;height: 15px;'>
      </button>

      <p>查看天气</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="addbus">
        <i :class="['iconfont', 'icon-kongzhi']" style="width: 500px;
       height:500px;"></i>
      </button>
      <p>公交系统</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="addmetro">
        <i :class="['iconfont', 'icon-supervision-full']"></i>
      </button>
      <p>地铁系统</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="transitVisible = true">
        <i :class="['iconfont', 'icon-icon-test']"></i>
      </button>
      <p>公交路线</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="addll">
        <i :class="['iconfont', 'icon-ruler']"></i>
      </button>
      <p>县区规划</p>
    </div>
    <div class="item">
      <DrawTool>
        <button class="item-btn" @click="trigger">
          <i :class="['iconfont', 'icon-paint']"></i>
        </button>
      </DrawTool>
      <p>范围查询</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="flyJinan">
        <i :class="['iconfont', 'icon-icon-test']"></i>
      </button>
      <p>飞行济南</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="controlCenter">
        <i :class="['iconfont', 'icon-supervision-full']"></i>
      </button>
      <p>控制中心</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="toggleRotate">
        <i :class="['iconfont', 'icon-fuwudiqiu']"></i>
      </button>
      <p>{{ mark }}</p>
    </div>
  </div>

  <!-- 公交路线规划对话框 -->
  <el-dialog v-model="transitVisible" title="公交路线规划" width="430px" :append-to-body="true">
    <div class="transit-form">
      <div class="transit-row">
        <span class="transit-label">起点</span>
        <el-select v-model="originName" style="width: 170px">
          <el-option v-for="l in landmarks" :key="l.name" :label="l.name" :value="l.name" />
        </el-select>
        <el-button size="small" @click="startPick('origin')">地图选点</el-button>
      </div>
      <div v-if="originPicked" class="picked-tip">✓ 已选起点：{{ originPicked.label }}</div>
      <div class="transit-row">
        <span class="transit-label">终点</span>
        <el-select v-model="destName" style="width: 170px">
          <el-option v-for="l in landmarks" :key="l.name" :label="l.name" :value="l.name" />
        </el-select>
        <el-button size="small" @click="startPick('dest')">地图选点</el-button>
      </div>
      <div v-if="destPicked" class="picked-tip">✓ 已选终点：{{ destPicked.label }}</div>
      <div class="transit-row">
        <span class="transit-label">方式</span>
        <el-select v-model="travelMode" style="width: 170px">
          <el-option label="综合" value="综合" />
          <el-option label="地铁优先" value="地铁优先" />
          <el-option label="公交" value="公交" />
        </el-select>
      </div>
      <div v-if="routeInfo" class="transit-info">
        <p class="ti-stat">预计用时：<b>{{ routeInfo.duration }}</b> 分钟　|　全程：<b>{{ routeInfo.distance }}</b> 米</p>
        <p class="ti-plan">乘车方案：<b>{{ routeInfo.description }}</b></p>
        <div v-if="routeInfo.stops && routeInfo.stops.length" class="ti-stops">
          <span class="ti-stops-title">途经站点（{{ routeInfo.stops.length }} 站，点击地图橙点可飞过去）</span>
          <div class="ti-stops-list">{{ routeInfo.stops.join(' → ') }}</div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="transitVisible = false">关闭</el-button>
      <el-button v-if="routeBounds" @click="overviewRoute">全览路线</el-button>
      <el-button type="primary" @click="queryTransit">查询路线</el-button>
    </template>
  </el-dialog>
</template>
  
<script setup>
import {ElMessage} from 'element-plus'
import axios from 'axios'
import DrawTool from './DrawTool.vue'
import { inject, onMounted, ref, computed, } from "vue";
import { LineLayer, PolygonLayer, Popup, HeatmapLayer, PointLayer } from "@antv/l7";
import { wgs2gcj, gcj2wgs, polyline2wgs } from '../Hooks/coord';
import mapboxgl from 'mapbox-gl';
const { scene, map } = inject("$scene_map");
// 定义一个自转状态
let isRotate = ref(true);
// 定义一个状态，控制面板
let g2Visible = ref(true);

const isInJinan = ref(false);

// 底部功能栏拖动
const footerBottom = ref(0);
let footerDragState = null;

const onFooterMouseDown = (e) => {
  if (e.target.closest('.item')) return; // 点在按钮上不拖动
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

const mark = computed(() => {
  return isRotate.value ? "停止自转" : "开启自转";
});

// 控制地球自转，这个函数只能让地球转10个经度
const rotate = () => {
  let zoom = map.getZoom();
  if (zoom < 5) {
    let center = map.getCenter();
    center.lng += 10;
    map.easeTo({ center, duration: 1000, easing: (n) => n });
  }
};

// 挂载的时候就开始自转
onMounted(async () => {
  rotate();
  // 地球动作结束的时候，再次调用地球自转的函数
  map.on("moveend", () => {
    isRotate.value && rotate();
  });
});

// 切换自转状态
const toggleRotate = () => {
  isRotate.value = !isRotate.value;
  if (!isRotate.value) {
    map.stop();
  } else {
    rotate();
  }
};

// 定义一个传给父组件的函数controlCenter
const emit = defineEmits(["controlCenter"]);
const controlCenter = () => {
  g2Visible.value = !g2Visible.value;
  emit("controlCenter", g2Visible.value);
};
const flyJinan = () => {
  if (isInJinan.value) {
    map.flyTo({
      center: [117.02, 36.65],
      zoom: 1,
    });
  } else {
    map.flyTo({
      center: [117.02, 36.65],
      zoom: 14,
      pitch: 45,
      bearing: 20,
    });
  }
  isInJinan.value = !isInJinan.value;
};

const trigger = () => {
  console.log("trigger");
};

const funcItems = [
  {
    title: "",
    icon: "icon-fuwudiqiu",
    trigger: toggleRotate,
  },
  {
    title: "控制中心",
    icon: "icon-supervision-full",
    trigger: controlCenter,
  },
  {
    title: "飞行济南",
    icon: "icon-icon-test",
    trigger: flyJinan,
  },
  {
    title: "范围查询",
    icon: "icon-paint",
    trigger: trigger,
  },
  {
    title: "地图测量",
    icon: "icon-ruler",
    trigger: trigger,
  },
].reverse();
let layer
let layer2
let popup
/*   fetch(
    'http://localhost:8080/Jinan_line'
  )
    .then(res => res.json())
    .then(data => {
      layer = new PolygonLayer({})
        .source(data)
        .color(
          'name',
          [
            '#1A4397',
            '#2555B7',
            '#3165D1',
            '#467BE8',
            '#6296FE',
            '#7EA6F9',
            '#98B7F7',
            '#BDD0F8',
            '#DDE6F7',
            '#F2F5FC'
          ].reverse()
        )
        .shape('fill')
        .active(true);
      layer2 = new LineLayer({
        zIndex: 2
      })
        .source(data)
        .color('#fff')
        .size(0.8);

      scene.addLayer(layer);
      scene.addLayer(layer2); 
    }); */
let isex = ref(false)
const addll = () => {
  if (!isex.value) {
    fetch('http://localhost:8080/Jinan_line')
      .then(res => res.json())
      .then(data => {
        // 只显示明显的边界线（透明无填充）
        layer2 = new LineLayer({ zIndex: 2 })
          .source(data)
          .color('#ffffff')
          .active({ color: '#ffd700' })
          .size(2)
          .style({ lineType: 'solid' });
        scene.addLayer(layer2);
        layer2.on('mousemove', e => {
          if (popup) { scene.removePopup(popup); }
          popup = new Popup({
            offsets: [0, 0],
            closeButton: true,
            closeOnClick: true
          })
            .setLnglat(e.lngLat)
            .setHTML(`<span>${e.feature.properties.name}</span>`);
          scene.addPopup(popup);
        });
      });
    isex.value = !isex.value
  } else {
    scene.removeLayer(layer2)
    isex.value = !isex.value
  }
}


let busStopLayer
let busex = ref(false)
const addbus = () => {
  if (!busex.value) {
    // 只显示真实公交站牌（高德 POI 查询），不虚构线路
    fetch('http://localhost:8080/Jinan_bus_stops')
      .then(res => res.json())
      .then(data => {
        // 注册公交图标（简洁金色公交车）
        if (!scene.hasImage('bus-icon')) {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="#FFD700" stroke="#a87500" stroke-width="1.5"/><line x1="7" y1="9" x2="17" y2="9" stroke="#fff" stroke-width="2" opacity="0.85"/></svg>`;
          scene.addImage('bus-icon', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
        }
        busStopLayer = new PointLayer({ zIndex: 3 })
          .source(data)
          .shape('bus-icon')
          .size(14);
        scene.addLayer(busStopLayer);
        busStopLayer.on('click', e => {
          const p = e.feature.properties;
          map.flyTo({ center: [p.lng, p.lat], zoom: 15, pitch: 30 });
          popup = new Popup({ closeButton: true, closeOnClick: true })
            .setLnglat([p.lng, p.lat])
            .setHTML(`<span>${p.name}</span>`);
          scene.addPopup(popup);
        });
      });
    busex.value = true;
  } else {
    scene.removeLayer(busStopLayer);
    busex.value = false;
  }
}

let metroStopLayer
let metroex = ref(false)
const addmetro = () => {
  if (!metroex.value) {
    // 只显示真实地铁站（高德 POI types=150500），青色圆点
    fetch('http://localhost:8080/Jinan_metro_stations')
      .then(res => res.json())
      .then(data => {
        // 注册地铁图标（简洁青色 M 圆形）
        if (!scene.hasImage('metro-icon')) {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#00E5FF" stroke="#00707f" stroke-width="1.5"/><text x="12" y="16" font-size="13" font-weight="bold" text-anchor="middle" fill="#00404a" font-family="Arial, sans-serif">M</text></svg>`;
          scene.addImage('metro-icon', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
        }
        metroStopLayer = new PointLayer({ zIndex: 3 })
          .source(data)
          .shape('metro-icon')
          .size(14);
        scene.addLayer(metroStopLayer);
        metroStopLayer.on('click', e => {
          const p = e.feature.properties;
          map.flyTo({ center: [p.lng, p.lat], zoom: 15, pitch: 30 });
          popup = new Popup({ closeButton: true, closeOnClick: true })
            .setLnglat([p.lng, p.lat])
            .setHTML(`<span>${p.name}（地铁站）</span>`);
          scene.addPopup(popup);
        });
      });
    metroex.value = true;
  } else {
    scene.removeLayer(metroStopLayer);
    metroex.value = false;
  }
}

// ---------- 公交路线规划（高德 transit API） ----------
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
const travelMode = ref('综合'); // 综合 | 地铁优先 | 公交
const routeInfo = ref(null);
const routeBounds = ref(null); // 路线全览边界
// 地图选点模式
const picking = ref(null); // null | 'origin' | 'dest'
const originPicked = ref(null); // { lng, lat, label }
const destPicked = ref(null);

const startPick = (which) => {
  picking.value = which;
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
      let transit = route.transits[0];
      // 地铁优先：优先选含地铁线路的方案
      if (travelMode.value === '地铁优先') {
        const metroTransit = route.transits.find(tt => tt.segments && tt.segments.some(s => s.bus && s.bus.buslines && s.bus.buslines.some(bl => bl.type === '地铁线路')));
        if (metroTransit) transit = metroTransit;
      }
      let allCoords = [];
      const busNames = [];
      const allStops = [];
      const pushStop = (s) => {
        if (s && s.location) {
          const [lng, lat] = s.location.split(',').map(Number);
          const [wlng, wlat] = gcj2wgs(lng, lat);
          allStops.push({ name: s.name, lng: wlng, lat: wlat });
        }
      };
      for (const seg of transit.segments) {
        // 公交段（地铁线路也在 bus 里，type 为「地铁线路」）
        if (seg.bus && seg.bus.buslines && seg.bus.buslines.length) {
          const bl = seg.bus.buslines[0];
          const label = bl.type === '地铁线路' ? '🚇' + bl.name : bl.name;
          busNames.push(label);
          allCoords = allCoords.concat(polyline2wgs(bl.polyline));
          pushStop(bl.departure_stop);
          (bl.via_stops || []).forEach(pushStop);
          pushStop(bl.arrival_stop);
        }
        // 地铁段（railway）
        if (seg.railway && (seg.railway.name || (seg.railway.lines && seg.railway.lines.length))) {
          const rw = seg.railway;
          const lineName = rw.name || (rw.lines && rw.lines[0] && rw.lines[0].name) || '地铁';
          busNames.push(lineName);
          if (rw.lines && rw.lines.length) {
            rw.lines.forEach(line => {
              if (line.polyline) allCoords = allCoords.concat(polyline2wgs(line.polyline));
            });
          }
          pushStop(rw.departure_stop);
          (rw.via_stops || []).forEach(pushStop);
          pushStop(rw.arrival_stop);
        }
      }
      // 计算路线边界（供「全览」按钮使用）
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      for (const [lng, lat] of allCoords) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      if (allCoords.length) routeBounds.value = [[minLng, minLat], [maxLng, maxLat]];

      routeInfo.value = {
        duration: Math.round(transit.duration / 60),
        distance: route.distance,
        description: busNames.join(' → ') || '步行直达',
        stops: allStops.map(s => s.name),
      };

      // 用 Mapbox 原生图层绘制（球状地图 globe 投影下能正确贴合，L7 图层会按平面墨卡托错位）
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', geometry: { type: 'LineString', coordinates: allCoords }, properties: {} },
          { type: 'Feature', geometry: { type: 'Point', coordinates: [o.lng, o.lat] }, properties: { kind: 'start' } },
          { type: 'Feature', geometry: { type: 'Point', coordinates: [d.lng, d.lat] }, properties: { kind: 'end' } },
          ...allStops.map(s => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [s.lng, s.lat] }, properties: { kind: 'stop', name: s.name } })),
        ],
      };
      if (map.getSource('transit-route')) {
        map.getSource('transit-route').setData(geojson);
      } else {
        map.addSource('transit-route', { type: 'geojson', data: geojson });
      }
      if (!map.getLayer('transit-route-line')) {
        map.addLayer({
          id: 'transit-route-line',
          type: 'line',
          source: 'transit-route',
          paint: { 'line-color': '#00d4ff', 'line-width': 5 },
        });
      }
      if (!map.getLayer('transit-route-points')) {
        map.addLayer({
          id: 'transit-route-points',
          type: 'circle',
          source: 'transit-route',
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-radius': ['match', ['get', 'kind'], 'start', 9, 'end', 9, 5],
            'circle-color': ['match', ['get', 'kind'], 'start', '#00ff88', 'end', '#ff3131', '#ffb300'],
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
          },
        });
      }
      map.flyTo({ center: [(o.lng + d.lng) / 2, (o.lat + d.lat) / 2], zoom: 13 });
    })
    .catch(err => {
      console.error('路线查询失败:', err);
      ElMessage.error('路线查询失败：' + (err && err.message ? err.message : err));
    });
};

// 点击途经站点/起终点 -> 飞过去并弹出名称
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

// 地图选点：点击地图设置起点/终点
map.on('click', (e) => {
  if (!picking.value) return;
  const { lng, lat } = e.lngLat;
  const label = `${lng.toFixed(5)}, ${lat.toFixed(5)}`;
  if (picking.value === 'origin') {
    originPicked.value = { lng, lat, label };
  } else {
    destPicked.value = { lng, lat, label };
  }
  picking.value = null;
  transitVisible.value = true;
});

// 全览：跳转到整条路线的视野，并自动关闭对话框
const overviewRoute = () => {
  if (routeBounds.value) {
    map.fitBounds(routeBounds.value, { padding: 80, duration: 1000 });
  }
  transitVisible.value = false;
};




var wztemperature
var wzwinddirection
var wzweather
var wzwindpower
var wzhumidity
let iswv = ref(0)

const weatherdata = fetch('/amap/v3/weather/weatherInfo?city=370100&key=f752ae50b3478617343635244aa5c843')
  .then(res => res.json())
  .then(data => {
    let { weather } = data.lives[0]
    let { winddirection } = data.lives[0]
    let { windpower } = data.lives[0]
    let { temperature } = data.lives[0]
    let {humidity} =data.lives[0]
    wzweather = { weather }.weather
    wztemperature = { temperature }.temperature
    wzwindpower = { windpower }.windpower
    wzwinddirection = { winddirection }.winddirection
    wzhumidity={humidity}.humidity
  })



const addweather = () => {
  ElMessage({
        duration:10000,
    
        customClass:'tianqi',
        message: `济南天气:` +wzweather+`   气温:`+wztemperature+`℃`+`   风级:`+wzwindpower+`   风向:`+wzwinddirection +`   宜居指数:`+wzhumidity,
        type: 'message',
  })
}



var highline
var highlineex = true
fetch('http://localhost:8080/Jinan_highline')
    .then(res => res.json())
    .then(data => {
      highline = new LineLayer({
      })
        .source(data)
        .size('Contour', h => {
          return [ h % 100 === 0 ? 1.0 : 0.5, h/6 ];
        })
        .shape('line')
        .scale('Contour', {
          type: 'quantize'
        })
        .style({
          heightfixed: 'true'
        })
        .color('Contour', [
          '#094D4A',
          '#146968',
          '#1D7F7E',
          '#289899',
          '#34B6B7',
          '#4AC5AF',
          '#5FD3A6',
          '#7BE39E',
          '#A1EDB8',
          '#CEF8D6'
        ]);
      });

const addhighline=()=>{
  if(highlineex){
    highlineex=!highlineex
    scene.addLayer(highline);
  }else{
    highlineex=!highlineex
    scene.removeLayer(highline)
  }
}


</script>
<style scoped>
.footer {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 8vh;
  z-index: 3;
  display: flex;
  justify-content: center;
  align-items: center;
  background: url("../assets/xzd-header.png") no-repeat;
  background-size: cover;
  transform: rotate(180deg);
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 15px;
  margin-bottom: -20px;
  font-size: 14px;
  transform: rotate(180deg);
}

.item-btn {
  border-radius: 50%;
  background-color: var(--control-bg-solid);
  background: linear-gradient(to bottom,
      var(--btn-grad-top),
      var(--btn-grad-bottom));
  padding: 15px;
  outline: none;
  border: none;
  box-shadow: 0 0 5px 3px rgb(34, 32, 32);
  cursor: pointer;
  color: #fff;
  margin-bottom: 4px;
}

.item-btn:hover {
  background-color: var(--control-bg);
  background: linear-gradient(to bottom,
      var(--btn-grad-top),
      var(--btn-grad-bottom));
  filter: brightness(1.15);
}



.weather-content {
  position: relative;
  top: 680px;
  right: -855px;
  min-height: 20px;
  background: #53697670;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  align-items: center;
  font-family: youyuan;
  color: #fff;
  font-size: 16px;

}

.transit-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.transit-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.transit-label {
  width: 40px;
  color: #333;
  font-weight: 600;
}

.transit-info {
  padding: 12px 14px;
  background: linear-gradient(135deg, #f0f6ff, #f8fafc);
  border: 1px solid #e3ecf5;
  border-radius: 8px;
  color: #333;
  font-size: 13px;
}

.transit-info p {
  margin: 5px 0;
  line-height: 1.5;
}

.transit-info b {
  color: #0a7bc4;
}

.ti-stops {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #d5e2ee;
}

.ti-stops-title {
  display: block;
  font-size: 12px;
  color: #8a97a5;
  margin-bottom: 4px;
}

.ti-stops-list {
  max-height: 72px;
  overflow-y: auto;
  color: #555;
  line-height: 1.6;
  font-size: 12px;
}

.picked-tip {
  font-size: 12px;
  color: #0a7bc4;
  margin-top: -8px;
  padding-left: 50px;
}

</style>
  