<template>
    <div class="g2-left">
      <div class="collapse-btn" @click="leftCollapsed = !leftCollapsed">
        {{ leftCollapsed ? '展开' : '收起' }}
      </div>
      <div v-show="!leftCollapsed">
        <Panel style="margin-bottom: 20px;">
          <template v-slot:header> 济南各区今日出行人口统计 </template>
          <ColumnChart v-bind="outdoorConfig" :data="outdoorData"></ColumnChart>
        </Panel>
        <Panel>
          <template v-slot:header> 济南各区实时公交在线表 </template>
          <RoseChart v-bind="busOnlineConfig" :data="busOnlineData"></RoseChart>
        </Panel>
      </div>
    </div>
  </template>

  <script setup>
  import { ref } from "vue";
  import Panel from "../components/Panel.vue";
  import { ColumnChart, RoseChart } from "@opd/g2plot-vue";
  import { usePeopleOutdoor } from "../Hooks/peopleOutdoor";
  import { useBusOnline } from "../Hooks/busOnline";
  const { config: outdoorConfig, data: outdoorData } = usePeopleOutdoor();
  const { config: busOnlineConfig, data: busOnlineData } = useBusOnline();

  const leftCollapsed = ref(false);
  </script>

  <style scoped>
  .g2-left {
    position: absolute;
    left: 1vw;
    top: 100px;
    width: 25vw;
  }

  .collapse-btn {
    position: absolute;
    top: -28px;
    right: 0;
    padding: 3px 14px;
    background: linear-gradient(135deg, rgba(0, 180, 255, .25), rgba(0, 120, 200, .2));
    color: #5fe0ff;
    border: 1px solid rgba(0, 212, 255, .5);
    border-radius: 12px;
    cursor: pointer;
    font-size: 12px;
    z-index: 5;
    transition: all .15s;
  }
  .collapse-btn:hover {
    background: rgba(0, 212, 255, .35);
    box-shadow: 0 0 10px rgba(0, 212, 255, .4);
  }
  </style>
