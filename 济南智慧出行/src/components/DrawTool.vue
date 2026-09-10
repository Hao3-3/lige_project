<template>
    <!--   我们使用el-popover组件，将BottomTool中的内容插入进来 -->
    <el-popover placement="top" :width="100" trigger="click" popper-style="background-color: #53697670;color:#fff">
      <template #reference>
        <slot></slot>
      </template>
      <!--     这里是popover中的内容 -->
      <div class="popover-w">
        <i v-for="item in tools" :class="computeClass(item)" @click="query(item)"></i>   
      </div>
    </el-popover>
    <DisplayCard v-if="showData" :dataS="dataSource" title="范围查询事件" @close="showData = false" />
    
  </template>
    
  <script setup>
  import DisplayCard from './DisplayCard.vue'
  import {ElMessage} from 'element-plus'
  import livepointsData from '../../GIS_DATA/Jinan_livepoints.json'
  import { ref, computed, onMounted, inject } from 'vue'
  import { DrawEvent, DrawPolygon, DrawRect, DrawCircle } from '@antv/l7-draw'
  const { scene, map } = inject("$scene_map");
  import { point, polygon, booleanPointInPolygon } from '@turf/turf'
  // 绘制项，我们使用这个数组进行循环
  const tools = ref(['drawPolygonTool', 'drawRectTool', 'drawCircleTool', 'delete'])
  // 绘制工具对象的存储位置
  const drawTools = {}
  let showData=ref(false)
  
  // 每一项的样式，这里使用计算属性，计算每一项应该使用哪个icon
  const computeClass = computed(() => (item) => {
    const res = {
      'iconfont': true,
      'query-item': true
    }
    res[`icon-${item}`] = true
    return res
  })
  
  onMounted(() => {
    initTool()
  })
  
  //清除绘制工具
  const stopDrawing = (destroy) => {
    for (let key in drawTools) {
      const tool = drawTools[key]
      tool.clear()
      tool.disable()
      tool.removeActiveFeature()
      //destroy && tool.destroy()
    }
  }
  
  // 初始化工具
  const initTool = () => {
    tools.value.forEach(tool => {
      switch (tool) {
        case 'drawPolygonTool':
          drawTools[tool] = new DrawPolygon(scene, {
            //展示面积
            areaOptions: {},
          });
          break;
        case 'drawRectTool':
          drawTools[tool] = new DrawRect(scene, {
            //展示面积
            areaOptions: {},
          });
          break;
        case 'drawCircleTool':
          drawTools[tool] = new DrawCircle(scene, {
            //展示面积
            areaOptions: {},
          });
          break;
        default:
          break;
      }
    })
  }
  let eventsData = []
  const dataSource = ref([])
  onMounted(() => {
    initTool()
    getData()
  })
  ElMessage({
        message: '若画面混乱，请调节浏览器比例大小',
        type: 'message',
  })
  
  const getData = () => {
    // 直接加载本地 GIS 居民点数据，不再依赖 8080 端口的 json-server
    eventsData = livepointsData.features || []
    ElMessage({ message: '居民点数据加载成功（共 ' + eventsData.length + ' 条）', type: 'success' })
  }
  
  
  
  
  
  
  const query = (type) => {
    stopDrawing()
    // 如果我们发现是删除，就直接return
    if (type === 'delete') {
      showData.value=false
      DisplayCard.value.removeall()
      dataSource.value=[]
      return
    }
    // 找到对应的绘制工具
    const activeTool = drawTools[type]
    if (activeTool) {
      // 激活绘制工具
      activeTool.enable();
      // DrawEvent.Change会监听每次数据变化的时候，返回绘制的结果数据,我们不需要绘制很多图形，所以每次只保留最新的数据
      activeTool.on('DrawEvent.Change', (allFeatures) => {
        // 每次双击之后，只保留当前绘制的
        allFeatures.forEach((item, index) => {
          if (index !== allFeatures.length - 1) {
            activeTool.removeFeature(item)
          }
        })
      });
    }
  
    activeTool.on(DrawEvent.Change, (allFeatures) => {
      // 每次双击之后，只保留当前绘制的
      let activeFeature = allFeatures[allFeatures.length - 1]
      allFeatures.forEach((item, index) => {
        if (index !== allFeatures.length - 1) {
          activeTool.removeFeature(item)
        }
      })
      // 根据数据做查询
      if (eventsData.length && activeFeature) {
        const { geometry: { coordinates: coordinatesActive } } = activeFeature
        // 使用turf判断框选范围内是否存在事件
        const resData = eventsData.filter(item => {
          const { geometry } = item
          if (geometry.type === 'Point') {
            const pt = point(geometry.coordinates);
            const poly = polygon(coordinatesActive)
            const isInArea = booleanPointInPolygon(pt, poly)
            return isInArea
          }
        })
        dataSource.value = resData
        showData.value = resData.length > 0
      }
    });
  
  }
  
  </script>
    
  <style scoped>
  .el-button+.el-button {
    margin-left: 8px;
  }
  
  .popover-w {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }
  
  .query-item:hover {
    cursor: pointer;
    background: linear-gradient(to bottom, rgba(26, 53, 79, 0.708), rgba(0, 128, 255, 0.281));
  }
  </style>