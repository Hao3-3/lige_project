<template>
  <SmartCity />
  <MapControl/>
  <G2chart v-if="g2Visible"/>
  <BottomTools @controlCenter="controlCenter" />
  
</template>
  
<script setup>
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
  