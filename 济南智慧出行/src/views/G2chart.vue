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
    padding: 2px 12px;
    background: var(--control-bg);
    color: #fff;
    border: 1px solid var(--accent);
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    z-index: 5;
  }
  </style>
