<template>
  <!-- 头部组件 -->
  <Header/>
  <div id="components">
    <router-view></router-view>
  </div>
  <div id="map"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import { app } from './main'
import { Scene } from '@antv/l7'
import { Mapbox } from '@antv/l7-maps'
import Header from './components/Header.vue'
import { add3DBuildings, setChineseLabels } from './Hooks/map3d'

// 组件加载的时候，初始化地图（球状地图）
onMounted(() => {
  mapboxgl.accessToken = import.meta.env.VITE_TOKEN
  mapboxgl.telemetry = false; // 关闭遥测统计，避免 events.mapbox.com 联网失败刷屏

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/navigation-night-v1',
    center: [117.02, 36.65],
    zoom: 3,
    projection: 'globe'
  })

  const scene = new Scene({
    id: 'map',
    map: new Mapbox({ mapInstance: map }),
    logoVisible: false
  })

  map.on('style.load', () => {
    // 球状地图大气雾化
    map.setFog({})
    // 地名汉化
    setChineseLabels(map)
    // 真实 3D 建筑（Mapbox 自带建筑数据挤出）
    add3DBuildings(map)
  })

  // 将 scene 和 map 传给子组件
  app.provide('$scene_map', { scene, map })
})
</script>

<style scoped>
 #map{
  width: 100vw;
  height: 100vh;
 }

 #components{
  position: absolute;
  z-index: 3;
 }

</style>
