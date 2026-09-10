<template>
    <div class="displayCard">
        <!-- 醒目标题栏：标题 + 数量 + 关闭 -->
        <div class="dc-header">
            <span class="dc-title">📍 {{ title }} · {{ tableData.length }} 个</span>
            <button class="dc-close" title="关闭" @click="onClose">✕</button>
        </div>
        <el-table :data="tableData" style="width: 100%" size="small" :max-height="400" @row-click="clickRow">
            <el-table-column :show-overflow-tooltip="true" prop="code" label="编号" width="70" />
            <el-table-column :show-overflow-tooltip="true" prop="name" label="名称" min-width="100" />
            <el-table-column fixed="right" label="操作" width="56">
                <template #default="scope">
                    <el-button link type="primary" size="small" @click.stop="handleClick(scope.row)">详情</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
    <el-dialog v-model="dialogVisible" title="居民点详情" width="60%" :append-to-body="true" class="dark-map-dialog">
        <el-table :data="detailData" style="width: 100%" size="small" :max-height="400" @row-click="clickRow">
            <el-table-column prop="name" label="名称" />
            <el-table-column :show-overflow-tooltip="true" prop="longtitude" label="坐标经度" />
            <el-table-column :show-overflow-tooltip="true" prop="latitude" label="坐标纬度" />
            <el-table-column prop="area" label="县区" />
            <el-table-column prop="level" label="宜居等级"/>
        </el-table>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false">关闭</el-button>
            </span>
        </template>
    </el-dialog>
</template>
      
<script setup>
import { ref, onMounted, inject, watch, onUnmounted, watchEffect } from 'vue'
import { PointLayer } from '@antv/l7'
const { scene, map } = inject("$scene_map");
const tableData = ref([])
const dialogVisible = ref(false)
const detailData = ref([])
let pointLayer,markLayer 
// 该组件接受外部传入的数据
const props = defineProps({
    dataS: Array,
    // 卡片标题（不同调用场景可自定义）
    title: {
        type: String,
        default: '事件列表'
    }
})
// 点击标题栏关闭按钮时通知父组件
const emit = defineEmits(['close'])
const onClose = () => emit('close')

// 组件挂载的时候，渲染点，并添加事故图片到scene中
onMounted(() => {
    !scene.hasImage('crash') && scene.addImage('crash', '/src/assets/icon/医院.png')
    reRenderCard()
})

// 接受到数据之后需要去在地图上渲染点
const reRenderCard = () => {
    // 每次重新绘制的时候，将pointLayer给移除
    if (pointLayer) {
        scene.removeLayer(pointLayer)
    }
    pointLayer = new PointLayer();
    if (props.dataS.length) {
        const source = []
        console.log(props.dataS);
        // 处理数据，然后在table中展示
        tableData.value = props.dataS.map(item => {
            const { geometry, properties: { code, name,strt, ...rest } } = item
            const coordinates = geometry.coordinates
            // 在点图层中添加数据
            source.push({
                lng: coordinates[0],
                lat: coordinates[1],
                name
            })
            return {
                geometry,
                code,
                name,
                strt,
                rest
            }
        })
        // 设置点图层
        pointLayer.source(source, {
            parser: {
                type: 'json',
                x: 'lng',
                y: 'lat'
            }
        }).shape('crash').size(16)
        // 将点图层放到场景中
        scene.addLayer(pointLayer)
    }
}

// 点击行，进行跳转
const clickRow = (row, column, event) => {
    // 添加动态点
    const data = {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: row.geometry.coordinates
                },
                properties: {
                    name: "marker"
                }
            }
        ]
    }

    if (row.geometry.coordinates) {
        markLayer && scene.removeLayer(markLayer)
        //在地图中添加动态点
        markLayer = new PointLayer({}).source(data)
        markLayer
            .shape('radar')
            .size(60)
            .color('#f00')
            .animate(true);
        scene.addLayer(markLayer);
        // 视角飞到事故点
        map.flyTo({
            //飞行的中心点
            center: row.geometry.coordinates,
            //飞行之后地图的放大级别
            zoom: 15,
            //控制飞行的速度
            speed: 0.4,
            /* 俯仰角0-90 */
            pitch: 30
        })

    }
}
watchEffect(() => {
  reRenderCard();
});
const removeall=()=>{
    pointLayer&&scene.removeLayer(pointLayer)
    markLayer && scene.removeLayer(markLayer)
}
onUnmounted(()=>{
    removeall()  
})
const handleClick = (row) => {
    const { event_num, geometry: { coordinates }, name, rest: { area, car_num, driver, id, level, phone } } = row
    detailData.value = [
        {
            event_num,
            longtitude: coordinates[0],
            latitude: coordinates[1],
            name,
            area,
            car_num,
            id,
            driver,
            level,
            phone
        }
    ]
    dialogVisible.value = true
}              
</script>
<style scoped>
.displayCard {
    width: 248px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    position: absolute;
    right: -260px;
    bottom: 88px;
    outline: none;
    /* 深色渐变底 + 青色高亮描边 + 发光阴影，让卡片在暗色地图上更醒目 */
    background: linear-gradient(160deg, rgba(10, 30, 55, 0.97), rgba(8, 20, 40, 0.97));
    border: 1.5px solid #00d4ff;
    border-radius: 8px;
    box-shadow: 0 0 18px 4px rgba(0, 212, 255, 0.45), 0 6px 22px rgba(0, 0, 0, 0.65);
    overflow: hidden;
    animation: dc-slide-in 0.28s ease-out;
}

/* 从右侧滑入 */
@keyframes dc-slide-in {
    from { opacity: 0; transform: translateX(34px); }
    to { opacity: 1; transform: translateX(0); }
}

/* 标题栏：青蓝渐变，最抓眼 */
.dc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    background: linear-gradient(90deg, #0a7bc4, #00d4ff);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.dc-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dc-close {
    flex: none;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
    transition: background 0.15s;
}

.dc-close:hover {
    background: rgba(255, 70, 70, 0.9);
}

.eleCeil {
    background: transparent;
    text-overflow: ellipsis;
    white-space: nowrap;
}

:deep(.el-table) {
    background-color: transparent;
    color: #e8f4ff;
}

:deep(.el-table tr) {
    background-color: transparent;
    color: #e8f4ff;
    cursor: pointer;
}

:deep(.el-table tr:hover) {
    background-color: rgba(0, 212, 255, 0.18);
}

:deep(.el-table--enable-row-transition .el-table__body td.el-table__cell) {
    background-color: transparent;
    color: #e8f4ff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

:deep(.el-table th.el-table__cell) {
    background-color: rgba(0, 123, 196, 0.4) !important;
    color: #ffffff;
    font-weight: 600;
}

:deep(.el-table td.el-table__cell) {
    border-bottom: none;
}

:deep(.el-table__body tr.hover-row > td.el-table__cell) {
    background-color: rgba(0, 212, 255, 0.18) !important;
}

:deep(.el-table__inner-wrapper::before) {
    height: 0;
}
</style>  
