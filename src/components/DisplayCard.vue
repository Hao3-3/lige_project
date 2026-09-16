<template>
    <div class="displayCard">
        <el-table :data="tableData" style="width: 200px" size="small" :max-height="400" @row-click="clickRow">
            <el-table-column :show-overflow-tooltip="true" prop="code" label="编号" width="60" />
            <el-table-column prop="name" label="名称" width="80" />
            <el-table-column fixed="right" label="操作" width="60">
                <template #default="scope">
                    <el-button link type="primary" size="small" @click.stop="handleClick(scope.row)">详情</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
    <el-dialog v-model="dialogVisible" title="居民点详情" width="60%" :append-to-body="true">
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
    dataS: Array
})

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
    width: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: -260px;
    bottom: 88px;
    outline: none;
    /* color: #fff; */
    background: #53697670;
    border-radius: 4px;
    box-shadow: 0 0 5px 3px #333;
}

.eleCeil {
    background: transparent;
    text-overflow: ellipsis;
    white-space: nowrap;
}

:deep(.el-table) {
    background-color: transparent;
}

:deep(.el-table tr) {
    background-color: transparent;
    /* color: #fff; */
    cursor: pointer;
}

:deep(.el-table tr:hover) {
    background-color: #333;
}

:deep(.el-table--enable-row-transition .el-table__body td.el-table__cell) {
    background-color: transparent;
}

:deep(.el-table th.el-table__cell) {
    background-color: transparent;
}

:deep(.el-table td.el-table__cell) {
    border-bottom: none;
}

:deep(.el-table__inner-wrapper::before) {
    height: 0;
}
</style>  