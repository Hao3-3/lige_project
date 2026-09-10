<template>
  <div ></div>
</template>

<script setup>
import {inject} from 'vue'
const scene_map = inject('$scene_map')
const { scene, map } = inject("$scene_map");
import { Scene, PointLayer, LineLayer,HeatmapLayer } from '@antv/l7';
scene.on('loaded', () => {
  fetch(
    'https://gw.alipayobjects.com/os/bmw-prod/7455fead-1dc0-458d-b91a-fb4cf99e701e.txt'
  )
    .then(res => res.text())
    .then(data => {
      const layer = new LineLayer({ blend: 'normal' })
        .source(data,
          {
            parser: {
              type: 'csv',
              x: 'lng1',
              y: 'lat1',
              x1: 'lng2',
              y1: 'lat2'
            }
          })
        .size(1)
        .shape('arc')
        .color('#6495ED')
        .animate({
          duration: 4,
          interval: 0.2,
          trailLength: 0.6
        });
      // .forward(false)
      scene.addLayer(layer);
    });
});
</script>
<style scoped>
</style>