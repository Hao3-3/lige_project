<template>
  <SmartCity />
  <MapControl/>
  <G2chart v-if="g2Visible"/>
  <BottomTools @controlCenter="controlCenter" />
  
</template>
  
<script setup>
// 首页视图：组装智能城市、地图控件、图表面板与底部工具栏
import { ref } from "vue";
import SmartCity from "../components/smartcity.vue";
import MapControl from "../components/mapcontrol.vue";
import G2chart from "./G2chart.vue";

  import BottomTools from "../components/BottomTools.vue";
  
  const g2Visible = ref(true);
  
  const controlCenter = (value) => {
    g2Visible.value = value;
  };



</script>

<style scoped>

</style>
  