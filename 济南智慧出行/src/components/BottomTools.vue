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
      <button class="item-btn" @click="layerPanelVisible = !layerPanelVisible">
        <i :class="['iconfont', 'icon-supervision-full']"></i>
      </button>
      <p>图层控制</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="transitVisible = true">
        <i :class="['iconfont', 'icon-icon-test']"></i>
      </button>
      <p>公交路线</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="toggleTraffic">
        <i :class="['iconfont', 'icon-kongzhi']"></i>
      </button>
      <p>实时路况</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="startReport">
        <i :class="['iconfont', 'icon-supervision-full']"></i>
      </button>
      <p>事件上报</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="poiDialogVisible = true">
        <i :class="['iconfont', 'icon-icon-test']"></i>
      </button>
      <p>周边检索</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="busArrivalDialog = true">
        <i :class="['iconfont', 'icon-icon-test']"></i>
      </button>
      <p>到站预测</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="scheduleDialog = true">
        <i :class="['iconfont', 'icon-supervision-full']"></i>
      </button>
      <p>班次查询</p>
    </div>
    <div class="item">
      <button class="item-btn" @click="openFavDialog">
        <i :class="['iconfont', 'icon-kongzhi']"></i>
      </button>
      <p>我的收藏</p>
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

  <!-- 公告通知滚动栏 -->
  <div v-if="announcements.length" class="announce-bar" @click="announceDialog = true">
    <span class="announce-icon">📢</span>
    <div class="announce-scroll">
      <span class="announce-text">{{ currentAnnounce }}</span>
    </div>
  </div>
  <!-- 实时路况文字摘要 -->
  <div v-if="trafficSummary" class="traffic-summary">🚦 {{ trafficSummary }}</div>
  <!-- 实时公交拥挤度图例 -->
  <div v-if="liveBusRunning" class="live-bus-legend">
    <div class="lbl-title">🚌 实时公交</div>
    <div class="lbl-row"><span class="dot" style="background:#2ecc71"></span>空闲</div>
    <div class="lbl-row"><span class="dot" style="background:#ffa726"></span>适中</div>
    <div class="lbl-row"><span class="dot" style="background:#ef5350"></span>拥挤</div>
    <div class="lbl-tip">点击站点查看下一班到站</div>
  </div>
  <div v-if="reportedEvents.length" class="marker-clear-btn" @click="clearReportedEvents">🧹 一键清除全部（{{ reportedEvents.length }}）<span style="opacity:.85;font-size:11px">　单点可在详情里单独移除</span></div>

  <!-- 公交路线规划对话框 -->
  <el-dialog v-model="transitVisible" title="出行路线规划" width="430px" :append-to-body="true" class="dark-map-dialog">
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
          <el-option label="驾车" value="驾车" />
          <el-option label="步行" value="步行" />
        </el-select>
      </div>
      <div v-if="routeInfo" class="transit-info">
        <div v-if="routeAlts.length > 1" class="route-alts">
          <div v-for="(alt, ai) in routeAlts" :key="ai"
               :class="['route-alt', { active: selectedAlt === ai }]"
               @click="selectAlternative(ai)">
            <div class="ra-top">
              <span class="ra-name">{{ alt.name }}</span>
              <span v-if="alt.badge" :class="['ra-badge', { rec: ai === 0 }]">{{ alt.badge }}</span>
            </div>
            <div class="ra-meta"><b>{{ alt.duration }}</b> 分钟 · {{ (alt.distance / 1000).toFixed(1) }} km<template v-if="alt.kind === 'drive'"><span v-if="alt.lights != null"> · {{ alt.lights }} 灯</span><span v-if="alt.tolls > 0"> · ¥{{ alt.tolls }}</span></template><div v-else class="ra-sub">{{ alt.sub }}</div></div>
          </div>
        </div>
        <p class="ti-stat">🚀 预计用时：<b>{{ routeInfo.duration }}</b> 分钟　|　全程：<b>{{ routeInfo.distance }}</b> 米</p>
        <template v-if="routeInfo.tfLevel">
          <div class="ti-traffic" :class="'tf-' + routeInfo.tfLevel">
            <span class="ti-traffic-dot"></span>
            当前路况：
            <b>{{ trafficText(routeInfo.tfLevel) }}</b>
            <span class="ti-traffic-time">（{{ routeInfo.tfTime }} 分钟）</span>
          </div>
        </template>
        <p class="ti-plan">乘车方案：<b>{{ routeInfo.description }}</b></p>
        <div v-if="routeInfo.stops && routeInfo.stops.length" class="ti-stops">
          <span class="ti-stops-title">途经站点（{{ routeInfo.stops.length }} 站，点击地图橙点可飞过去）</span>
          <div class="ti-stops-list">{{ routeInfo.stops.join(' → ') }}</div>
        </div>
        <div v-if="routeInfo.driveSteps && routeInfo.driveSteps.length" class="ti-steps">
          <span class="ti-stops-title">行驶指引（{{ routeInfo.driveSteps.length }} 步）</span>
          <ol class="ti-step-list">
            <li v-for="(stp, i) in routeInfo.driveSteps" :key="i" v-html="stp"></li>
          </ol>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="transitVisible = false">关闭</el-button>
      <el-button v-if="routeInfo" @click="favCurrentRoute">⭐ 收藏此路线</el-button>
      <el-button v-if="routeBounds" @click="overviewRoute">全览路线</el-button>
      <el-button type="primary" @click="queryTransit">查询路线</el-button>
    </template>
  </el-dialog>

  <!-- 交通事件上报对话框 -->
  <el-dialog v-model="reportDialogVisible" title="交通事件上报" width="440px" :append-to-body="true" class="dark-map-dialog">
    <el-form label-width="80px">
      <el-form-item label="事件类型">
        <el-radio-group v-model="reportForm.type">
          <el-radio v-for="t in EVENT_TYPES" :key="t.value" :value="t.value">
            {{ t.icon }} {{ t.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="严重程度">
        <el-radio-group v-model="reportForm.level">
          <el-radio :value="1">一般</el-radio>
          <el-radio :value="2">较重</el-radio>
          <el-radio :value="3">严重</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="发生位置">
        <span style="font-size:13px;color:#b9d6ec">
          {{ reportForm.lng != null ? Number(reportForm.lng).toFixed(5) + ', ' + Number(reportForm.lat).toFixed(5) : '尚未在地图选点' }}
        </span>
      </el-form-item>
      <el-form-item label="地点名称">
        <el-input v-model="reportForm.address" placeholder="选点后自动获取，可手动修改" />
      </el-form-item>
      <el-form-item label="事件描述">
        <el-input v-model="reportForm.description" type="textarea" :rows="3" placeholder="请简要描述事件情况，如拥堵方向、事故车辆等" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="reportDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitReport">提交上报</el-button>
    </template>
  </el-dialog>

  <!-- 周边设施检索对话框 -->
  <el-dialog v-model="poiDialogVisible" title="周边设施检索" width="480px" :append-to-body="true" class="dark-map-dialog">
    <div class="transit-form">
      <div class="transit-row">
        <span class="transit-label">中心</span>
        <span style="flex:1;font-size:13px;color:#555">{{ poiCenter ? poiCenter.label : '尚未选择' }}</span>
        <el-button size="small" @click="startPickPoiCenter">地图选点</el-button>
      </div>
      <div class="transit-row">
        <span class="transit-label">类别</span>
        <el-select v-model="poiCategory" style="flex:1">
          <el-option v-for="c in POI_CATEGORIES" :key="c.types" :label="c.icon + ' ' + c.label" :value="c.types" />
        </el-select>
      </div>
      <div class="transit-row">
        <span class="transit-label">半径</span>
        <el-slider v-model="poiRadius" :min="500" :max="3000" :step="500" style="flex:1" />
        <span style="width:56px;text-align:right">{{ poiRadius }}米</span>
      </div>
      <el-button type="primary" style="width:100%" @click="queryPoi">开始检索</el-button>
      <div v-if="poiList.length" class="poi-cards">
        <div class="poi-cards-tip">共 {{ poiList.length }} 个结果 · 单击卡片定位，双击或点「规划路线」导航</div>
        <div class="poi-card" v-for="(pitem, i) in poiList" :key="i"
             :class="{ active: selectedPoiIndex === i }"
             :style="{ borderLeftColor: pitem.color }"
             title="单击定位，双击或点规划路线"
             @click="selectPoi(pitem, i)" @dblclick="planRouteToPoi(pitem)">
          <div class="pc-head">
            <span class="pc-name">📍 {{ pitem.name }}</span>
            <span class="pc-dist">{{ pitem.distance }}m</span>
          </div>
          <div class="pc-addr">{{ pitem.address }}<span v-if="pitem.tel && pitem.tel !== '[]'"> · {{ pitem.tel }}</span></div>
          <div class="pc-go" @click.stop="planRouteToPoi(pitem)">🧭 规划路线 ›</div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="closePoi">关闭并清除标记</el-button>
    </template>
  </el-dialog>

  <!-- 图层控制面板：公交/地铁的「线路」与「站点图标」可分别单独显示 -->
  <div v-show="layerPanelVisible" class="layer-panel">
    <div class="layer-panel-head">
      <span>图层控制</span>
      <button class="layer-close" @click="layerPanelVisible = false">✕</button>
    </div>

    <div class="layer-group">
      <div class="layer-group-title">🚌 公交系统</div>
      <label class="layer-row">
        <span>线路显示</span>
        <el-switch v-model="busShowLines" size="small" @change="syncBusLayer" />
      </label>
      <label class="layer-row">
        <span>站点图标</span>
        <el-switch v-model="busShowStops" size="small" @change="syncBusLayer" />
      </label>
      <label class="layer-row">
        <span>实时公交车辆</span>
        <el-switch v-model="busShowVehicles" size="small" @change="syncBusLayer" />
      </label>
      <label class="layer-row">
        <span>站点到站预测</span>
        <el-switch v-model="busStopPredict" size="small" />
      </label>
    </div>

    <div class="layer-group">
      <div class="layer-group-title">🚇 地铁系统</div>
      <label class="layer-row">
        <span>线路显示</span>
        <el-switch v-model="metroShowLines" size="small" @change="syncMetroLayer" />
      </label>
      <label class="layer-row">
        <span>站点图标</span>
        <el-switch v-model="metroShowStops" size="small" @change="syncMetroLayer" />
      </label>
    </div>
  </div>
  <!-- 区县事件列表：点击区县后展示该区县内的事件点 -->
  <div class="county-event-card">
    <DisplayCard v-if="countyEventsVisible" :dataS="countyEvents" title="区县事件点" @close="clearCountyEvents" />
  </div>
  <!-- 交通事件详情固定卡片（不随鼠标移动消失，内部按钮可稳定点击） -->
  <div v-if="eventDetail" class="event-detail-card">
    <div class="edc-head">
      <span :style="{ color: eventDetail.color }">{{ eventDetail.iconChar }} {{ eventDetail.typeLabel }}</span>
      <span class="edc-close" @click="eventDetail = null" title="关闭">✕</span>
    </div>
    <div class="edc-body">
      <div class="edc-row"><span class="edc-k">地点</span><span>{{ eventDetail.address }}</span></div>
      <div class="edc-row"><span class="edc-k">严重程度</span><span>{{ eventDetail.levelText }}</span></div>
      <div class="edc-row"><span class="edc-k">详细描述</span><span>{{ eventDetail.description || '无' }}</span></div>
      <div class="edc-row"><span class="edc-k">上报人</span><span>{{ eventDetail.username }}</span></div>
      <div v-if="eventDetail.createdAt" class="edc-row"><span class="edc-k">上报时间</span><span>{{ eventDetail.createdAt }}</span></div>
    </div>
    <div class="edc-foot">
      <button class="edc-del" @click="removeCurrentEvent">🗑 移除该标点</button>
    </div>
  </div>

  <!-- 公告通知详情对话框 -->
  <el-dialog v-model="announceDialog" title="公告通知" width="500px" :append-to-body="true" class="dark-map-dialog">
    <div class="announce-list">
      <div v-for="ann in announcements" :key="ann.id" class="announce-item" :class="'ann-priority-' + ann.priority">
        <div class="ann-head">
          <span class="ann-type">{{ ann.type === 'alert' ? '⚠️预警' : ann.type === 'adjustment' ? '🔧调整' : '📢通知' }}</span>
          <span class="ann-title">{{ ann.title }}</span>
        </div>
        <div class="ann-content">{{ ann.content }}</div>
        <div class="ann-time">{{ formatTime(ann.created_at) }}</div>
      </div>
    </div>
    <template #footer><el-button @click="announceDialog = false">关闭</el-button></template>
  </el-dialog>

  <!-- 实时公交到站预测对话框 -->
  <el-dialog v-model="busArrivalDialog" title="实时公交到站预测" width="480px" :append-to-body="true" class="dark-map-dialog">
    <div class="transit-form">
      <div class="transit-row">
        <span class="transit-label">站点</span>
        <el-input v-model="busArrivalStation" placeholder="请输入站点名称（如泉城广场）" style="flex:1" @keyup.enter="queryBusArrival" />
        <el-button type="primary" size="small" :loading="busArrivalLoading" @click="queryBusArrival">查询</el-button>
      </div>
      <div v-if="busArrivalData && busArrivalData.arrivals && busArrivalData.arrivals.length" class="arrival-result">
        <div class="arrival-station" @click="flyToArrivalStation">
          🚏 {{ busArrivalData.station }}
          <span class="arrival-peak" v-if="busArrivalData.is_peak">高峰时段</span>
          <span class="arrival-peak off" v-else>平峰时段</span>
          <span class="arrival-fly">📍 定位</span>
        </div>
        <div class="arrival-list">
          <div v-for="(a, i) in busArrivalData.arrivals" :key="i" class="arrival-item">
            <div class="arrival-line">{{ a.line_name }}</div>
            <div class="arrival-eta">
              <span class="eta-min" :class="{ urgent: a.eta_min <= 3 }">{{ a.eta_min }}</span>
              <span class="eta-unit">分钟</span>
            </div>
            <div class="arrival-info">
              <span :class="'crowd-' + a.crowd">{{ a.crowd }}</span>
              <span class="arrival-interval">间隔{{ a.interval_min }}分</span>
            </div>
            <div class="arrival-time">首{{ a.first_bus }} 末{{ a.last_bus }}</div>
          </div>
        </div>
      </div>
      <div v-else-if="busArrivalData && !busArrivalData.arrivals?.length" class="empty-tip">未找到该站点的到站信息</div>
    </div>
    <template #footer><el-button @click="busArrivalDialog = false">关闭</el-button></template>
  </el-dialog>

  <!-- 班次时刻表对话框 -->
  <el-dialog v-model="scheduleDialog" title="班次时刻表" width="560px" :append-to-body="true" class="dark-map-dialog">
    <div class="transit-form">
      <div class="transit-row">
        <span class="transit-label">线路</span>
        <el-input v-model="scheduleLine" placeholder="输入线路名查询（如K1路），留空查全部" style="flex:1" @keyup.enter="querySchedules" />
        <el-button type="primary" size="small" :loading="scheduleLoading" @click="querySchedules">查询</el-button>
      </div>
      <div v-if="scheduleList.length" class="schedule-table">
        <div class="sch-row sch-head">
          <span>线路</span><span>方向</span><span>首班</span><span>末班</span><span>间隔</span><span>高峰</span><span>备注</span>
        </div>
        <div v-for="s in scheduleList" :key="s.id" class="sch-row">
          <span class="sch-line">{{ s.line_name }}</span>
          <span>{{ s.direction }}</span>
          <span>{{ s.first_bus }}</span>
          <span>{{ s.last_bus }}</span>
          <span>{{ s.interval_min }}分</span>
          <span>{{ s.interval_peak }}分</span>
          <span class="sch-note">{{ s.note || '—' }}</span>
        </div>
      </div>
      <div v-else class="empty-tip">请点击查询按钮加载班次数据</div>
    </div>
    <template #footer><el-button @click="scheduleDialog = false">关闭</el-button></template>
  </el-dialog>

  <!-- 路线详情对话框（点击地图上的路线弹出） -->
  <el-dialog v-model="routeDetailDialog" title="路线详情" width="540px" :append-to-body="true" class="dark-map-dialog">
    <div v-if="routeDetail" class="route-detail">
      <div class="rd-section">
        <div class="rd-title">📍 路线信息</div>
        <div class="rd-od">{{ routeDetail.origin }} → {{ routeDetail.dest }}</div>
        <div class="rd-meta">
          <span v-if="routeDetail.badge" class="rd-badge">{{ routeDetail.badge }}</span>
          <span>模式：{{ routeDetail.mode }}</span>
          <span>用时：<b>{{ routeDetail.duration }}</b> 分钟</span>
          <span>距离：<b>{{ (routeDetail.distance/1000).toFixed(1) }}</b> km</span>
        </div>
        <div class="rd-desc">{{ routeDetail.description }}</div>
        <div class="rd-meta" v-if="routeDetail.walk != null">🚶 步行：{{ (routeDetail.walk/1000).toFixed(1) }} km</div>
        <div class="rd-meta" v-if="routeDetail.tolls != null">💰 过路费：{{ routeDetail.tolls }} 元</div>
        <div class="rd-meta" v-if="routeDetail.lights != null">🚦 红绿灯：{{ routeDetail.lights }} 个</div>
      </div>
      <div class="rd-section">
        <div class="rd-title">🚦 拥堵情况</div>
        <template v-if="routeDetail.kind === 'drive' && routeDetail.trafficStats && routeDetail.trafficStats.length">
          <div class="rd-traffic-total">沿途路况总里程 {{ (routeDetail.trafficStats.total/1000).toFixed(1) }} km</div>
          <div class="rd-traffic-list">
            <div v-for="t in routeDetail.trafficStats" :key="t.status" class="rd-traffic-item">
              <span class="rd-traffic-dot" :style="{background:t.color}"></span>
              <span class="rd-traffic-label">{{ t.label }}</span>
              <span class="rd-traffic-len">{{ (t.length/1000).toFixed(1) }} km</span>
              <div class="rd-traffic-bar"><div class="rd-traffic-fill" :style="{width:t.pct+'%',background:t.color}"></div></div>
              <span class="rd-traffic-pct">{{ t.pct }}%</span>
            </div>
          </div>
        </template>
        <template v-else-if="routeDetail.tfLevel">
          <div class="rd-traffic-simple" :class="'tf-'+routeDetail.tfLevel">
            公交方案预估：{{ trafficText(routeDetail.tfLevel) }}（约 {{ routeDetail.tfTime }} 分钟）
          </div>
        </template>
        <div v-else class="empty-tip">暂无拥堵数据</div>
      </div>
      <div class="rd-section">
        <div class="rd-title">🚌 班次情况</div>
        <template v-if="routeDetail.schedules && routeDetail.schedules.length">
          <div class="rd-sch-table">
            <div class="rd-sch-head"><span>线路</span><span>首班</span><span>末班</span><span>平峰</span><span>高峰</span></div>
            <div v-for="(sc,i) in routeDetail.schedules" :key="i" class="rd-sch-row">
              <span class="rd-sch-name">{{ sc.name }}</span>
              <span>{{ sc.first_bus }}</span>
              <span>{{ sc.last_bus }}</span>
              <span>{{ sc.interval_min }}分</span>
              <span>{{ sc.interval_peak }}分</span>
            </div>
          </div>
          <div class="rd-sch-note">* 班次为参考时刻，实际以运营方公告为准</div>
        </template>
        <div v-else class="empty-tip">自驾 / 步行方案无固定班次</div>
      </div>
    </div>
    <template #footer><el-button @click="routeDetailDialog = false">关闭</el-button></template>
  </el-dialog>

  <!-- 收藏与历史记录对话框 -->
  <el-dialog v-model="favDialog" title="我的收藏与历史" width="520px" :append-to-body="true" class="dark-map-dialog">
    <el-tabs v-model="favTab">
      <el-tab-pane label="⭐ 我的收藏" name="favorites">
        <div v-if="favList.length" class="fav-list">
          <div v-for="f in favList" :key="f.id" class="fav-item fav-clickable" @click="applyFavorite(f)">
            <span class="fav-type" :class="'fav-' + f.type">{{ f.type === 'route' ? '🛣️路线' : '🚏站点' }}</span>
            <span class="fav-name">{{ f.name }}</span>
            <span class="fav-time">{{ formatTime(f.created_at) }}</span>
            <button class="fav-del" @click.stop="removeFavorite(f.id)">✕</button>
          </div>
        </div>
        <div v-else class="empty-tip">暂无收藏，规划路线后可点击「⭐ 收藏此路线」</div>
      </el-tab-pane>
      <el-tab-pane label="📋 搜索历史" name="history">
        <div v-if="historyList.length" class="fav-list">
          <div v-for="h in historyList" :key="h.id" class="fav-item fav-clickable" @click="replayByName(h.query_text)">
            <span class="fav-type" :class="'fav-' + h.type">{{ h.type === 'transit' ? '🛣️' : '📍' }}</span>
            <span class="fav-name">{{ h.query_text }}</span>
            <span class="fav-time">{{ formatTime(h.created_at) }}</span>
          </div>
        </div>
        <div v-else class="empty-tip">暂无搜索历史</div>
        <el-button v-if="historyList.length" size="small" type="danger" plain @click="clearHistory" style="margin-top:10px">清空历史</el-button>
      </el-tab-pane>
    </el-tabs>
    <template #footer><el-button @click="favDialog = false">关闭</el-button></template>
  </el-dialog>
</template>
  
<script setup>
import {ElMessage} from 'element-plus'
import axios from 'axios'
import DrawTool from './DrawTool.vue'
import DisplayCard from './DisplayCard.vue'
import { inject, onMounted, ref, computed, } from "vue";
import { LineLayer, PolygonLayer, Popup, HeatmapLayer, PointLayer } from "@antv/l7";
import { wgs2gcj, gcj2wgs, polyline2wgs } from '../Hooks/coord';
import mapboxgl from 'mapbox-gl';
// 直接引入本地 GIS 数据（不再依赖 json-server 8080 端口）
import busLinesData from '../../GIS_DATA/Jinan_bus_lines.json'
import metroLinesData from '../../GIS_DATA/Jinan_metro_lines.json'
import busStopsData from '../../GIS_DATA/Jinan_bus_stops.json'
import metroStopsData from '../../GIS_DATA/Jinan_metro_stations.json'
import highlineData from '../../GIS_DATA/Jinan_highline.json'
import countyLineData from '../../GIS_DATA/Jinan_line.json'
import livepointsData from '../../GIS_DATA/Jinan_livepoints.json'
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
    // 实时路况开启时，地图移动结束后按新视野刷新
    trafficOn.value && fetchTraffic();
  });
  // 加载已上报的交通事件并在地图标记
  loadReportedEvents();
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
let hoverPopup = null; // 事件点/POI 鼠标悬停弹窗
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
const layerPanelVisible = ref(false) // 图层控制面板显隐
// —— 区县事件功能：点击区县后展示该区县内的事件点（居民点）——
const countyEvents = ref([])           // 当前选中区县的事件点列表（传给 DisplayCard）
const countyEventsVisible = ref(false) // 是否显示事件列表卡片
let countyEventLayer = null            // 事件点标记图层（L7）

// 按区县名查询该区县内的事件点（Jinan_livepoints 通过 area 字段关联区县）
const queryCountyEvents = (countyName) => {
  // 先移除上一次的事件标记图层
  if (countyEventLayer) { scene.removeLayer(countyEventLayer); countyEventLayer = null; }
  const list = livepointsData.features.filter(f => f.properties.area === countyName);
  if (list.length) {
    // 在区县范围内用醒目圆点标记事件点
    countyEventLayer = new PointLayer({ zIndex: 5 })
      .source(list.map(f => ({
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        name: f.properties.name,
        level: f.properties.level,
      })), {
        parser: { type: 'json', x: 'lng', y: 'lat' }
      })
      .shape('circle')
      .size(9)
      .color('#ff4d4f')
      .style({ stroke: '#ffffff', strokeWidth: 1.5, opacity: 0.95 });
    scene.addLayer(countyEventLayer);
  }
  countyEvents.value = list;
  countyEventsVisible.value = list.length > 0;
  return list.length;
}

// 清除区县事件展示（关闭区县图层时调用）
const clearCountyEvents = () => {
  if (countyEventLayer) { scene.removeLayer(countyEventLayer); countyEventLayer = null; }
  countyEvents.value = [];
  countyEventsVisible.value = false;
}


const addll = () => {
  if (!isex.value) {
    // 只显示明显的边界线（透明无填充）
    layer2 = new LineLayer({ zIndex: 2 })
      .source(countyLineData)
      .color('#ffffff')
      .active({ color: '#ffd700' })
      .size(2)
      .style({ lineType: 'solid' });
    scene.addLayer(layer2);
    // 悬停区县边界：显示区县名称
    layer2.on('mousemove', e => {
      map.getCanvas().style.cursor = 'pointer';
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
    // 移出区县边界：关闭弹窗、恢复光标
    layer2.on('mouseout', () => {
      map.getCanvas().style.cursor = '';
      if (popup) { scene.removePopup(popup); popup = null; }
    });
    // —— 事件功能：点击区县 -> 展示该区县信息与该区县内的事件点 ——
    layer2.on('click', e => {
      const p = e.feature.properties;
      if (popup) { scene.removePopup(popup); }
      const count = queryCountyEvents(p.name);
      popup = new Popup({
        offsets: [0, 0],
        closeButton: true,
        closeOnClick: true
      })
        .setLnglat(e.lngLat)
        .setHTML(`<div style="font-size:13px;line-height:1.8">
          <b style="color:#ffd700">🏙 ${p.name}</b><br/>
          宜居评价：最佳 ${p['最佳适宜']} · 比较 ${p['比较适宜']} · 适宜 ${p['适宜']}<br/>
          区内事件点：<b style="color:#ff4d4f">${count}</b> 个
        </div>`);
      scene.addPopup(popup);
      if (count > 0) {
        ElMessage.success(`「${p.name}」内共有 ${count} 个事件点，已在地图右侧列出`);
      } else {
        ElMessage.info(`「${p.name}」暂无事件数据`);
      }
    });
    isex.value = !isex.value
  } else {
    scene.removeLayer(layer2)
    clearCountyEvents()
    if (popup) { scene.removePopup(popup); popup = null; }
    isex.value = !isex.value
  }
}


let busStopLayer
let busex = ref(false)
// 公交图层控制：线路 / 站点图标 分别显示
const busShowLines = ref(true)
const busShowStops = ref(false)
const BUS_STOP_NAME = 'jinan-bus-stops' // L7 图层唯一名，供 getLayerByName 查询

// 创建公交站图标图层（L7），只在需要时 add
function ensureBusStopLayer() {
  if (busStopLayer) return busStopLayer;
  if (!scene.hasImage('bus-icon')) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="#FFD700" stroke="#a87500" stroke-width="1.5"/><line x1="7" y1="9" x2="17" y2="9" stroke="#fff" stroke-width="2" opacity="0.85"/></svg>`;
    scene.addImage('bus-icon', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }
  busStopLayer = new PointLayer({ zIndex: 7, name: BUS_STOP_NAME })
    .source(busStopsData)
    .shape('bus-icon')
    .size(19);
  busStopLayer.on('click', e => {
    const p = e.feature.properties;
    showBusStopPrediction(p);
  });
  return busStopLayer;
}

// 同步公交子图层：根据两个开关决定线路/站点图标是否显示
// 开关独立生效（与主按钮 busex 状态无关），始终按当前开关值同步
function syncBusLayer() {
  // 站点图标（L7）：先移除再按需添加（幂等）
  if (busStopLayer) { scene.removeLayer(busStopLayer); busStopLayer = null; }
  if (busShowStops.value) scene.addLayer(ensureBusStopLayer());
  // 线路（Mapbox 原生）
  if (busShowLines.value) addBusLines();
  else removeBusLines();
  // 实时公交车辆跟随开关
  if (busShowVehicles.value) startLiveBuses(); else stopLiveBuses();
  // 主按钮状态跟随：只要有任一子层在显示就视为「打开」，否则视为「关闭」
  busex.value = !!(busShowLines.value || busShowStops.value || busShowVehicles.value);
}

const addbus = () => {
  // 主按钮：只是整体显隐开关；内部组件是否显示由图层控制面板决定
  if (busex.value) {
    // 关闭：子层与实时车辆全部关闭
    busShowLines.value = false;
    busShowStops.value = false;
    busShowVehicles.value = false;
    if (busStopLayer) { scene.removeLayer(busStopLayer); busStopLayer = null; }
    removeBusLines();
    stopLiveBuses();
    busex.value = false;
  } else {
    // 打开：显示线路、站点（可点击看到站预测）与实时车辆
    busShowLines.value = true;
    busShowStops.value = true;
    busShowVehicles.value = true;
    syncBusLayer();
    busex.value = true;
    ElMessage.success('实时公交已开启：车辆动态移动，点击站点查看下一班到站预测');
  }
}

let metroStopLayer
let metroex = ref(false)
const metroShowLines = ref(true)
const metroShowStops = ref(false)
const METRO_STOP_NAME = 'jinan-metro-stops'

function ensureMetroStopLayer() {
  if (metroStopLayer) return metroStopLayer;
  if (!scene.hasImage('metro-icon')) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#00E5FF" stroke="#00707f" stroke-width="1.5"/><text x="12" y="16" font-size="13" font-weight="bold" text-anchor="middle" fill="#00404a" font-family="Arial, sans-serif">M</text></svg>`;
    scene.addImage('metro-icon', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }
  metroStopLayer = new PointLayer({ zIndex: 3, name: METRO_STOP_NAME })
    .source(metroStopsData)
    .shape('metro-icon')
    .size(14);
  metroStopLayer.on('click', e => {
    const p = e.feature.properties;
    map.flyTo({ center: [p.lng, p.lat], zoom: 15, pitch: 30 });
    popup = new Popup({ closeButton: true, closeOnClick: true })
      .setLnglat([p.lng, p.lat])
      .setHTML(`<span>${p.name}（地铁站）</span>`);
    scene.addPopup(popup);
  });
  return metroStopLayer;
}

// 同步地铁子图层（开关独立生效，与主按钮状态无关）
function syncMetroLayer() {
  if (metroStopLayer) { scene.removeLayer(metroStopLayer); metroStopLayer = null; }
  if (metroShowStops.value) scene.addLayer(ensureMetroStopLayer());
  if (metroShowLines.value) addMetroLines();
  else removeMetroLines();
  metroex.value = !!(metroShowLines.value || metroShowStops.value);
}

const addmetro = () => {
  if (metroex.value) {
    // 关闭
    metroShowLines.value = false;
    metroShowStops.value = false;
    if (metroStopLayer) { scene.removeLayer(metroStopLayer); metroStopLayer = null; }
    removeMetroLines();
    metroex.value = false;
  } else {
    // 打开：默认显示线路
    metroShowLines.value = true;
    metroShowStops.value = false;
    syncMetroLayer();
    metroex.value = true;
  }
}

// ---------- 公交 / 地铁线路（真实线路几何 + 途经站点） ----------
// 在线路图层上增加悬停高亮：鼠标划过时整条线增亮放大，并弹信息
let hoveredLineId = null;
function applyLineHover(feature, on) {
  if (on) {
    if (hoveredLineId !== null) {
      map.setFeatureState({ source: 'bus-lines', id: hoveredLineId }, { hover: false });
      hoveredLineId = null;
    }
    if (feature && feature.id !== undefined) {
      map.setFeatureState({ source: 'bus-lines', id: feature.id }, { hover: true });
      hoveredLineId = feature.id;
    }
  } else if (hoveredLineId !== null) {
    map.setFeatureState({ source: 'bus-lines', id: hoveredLineId }, { hover: false });
    hoveredLineId = null;
  }
}
const BUS_COLORS = [
  '#ff7a45', '#ffc53d', '#36cfc9', '#40a9ff', '#9254de', '#f759ab',
  '#73d13d', '#ff4d4f', '#13c2c2', '#722ed1', '#fa8c16', '#2f54eb', '#a0d911',
];

// 计算两经纬度点间的大圆距离（公里）—— 仅作数据里没有真实长度时的兜底
function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// 为线路集合生成 Mapbox 源数据（每条线带 真实长度/起终点/途经站点）
function buildLinesGeoJSON(features, mode) {
  return {
    type: 'FeatureCollection',
    features: features.map((f, idx) => {
      const coords = f.geometry.coordinates;
      const p = f.properties || {};
      const name = p.name;
      // 优先使用数据里带的真实公里数（高德返回），否则按坐标兜底计算
      let km = p.distance ? Math.round(Number(p.distance) * 10) / 10 : null;
      if (!km) {
        let s = 0;
        for (let i = 1; i < coords.length; i++) s += haversineKm(coords[i - 1], coords[i]);
        km = Math.round(s * 10) / 10;
      }
      // 关键：在此处（数据仍是原始导入的 JSON）就把每个站名解析成坐标，
      // 序列化成 JSON 字符串存进属性。弹窗直接解析这个字符串即可拿到 [站名, 坐标]，
      // 完全绕开 Mapbox queryRenderedFeatures 对数组属性的反序列化（会把 stops 变成字符串）问题。
      // 查不到精确坐标的站，退而求其次：按站点在线路上的序号，从折线里取一个近似点做兜底坐标，
      // 保证每个站点都能点击飞行（地铁精确、公交近似）。
      const stops = p.stops || [];
      const stopInfoJson = JSON.stringify(stops.map((s, i) => {
        const nm = String(s).trim();
        const c = STATION_COORDS[nm];
        if (c) return { name: nm, lng: c[0], lat: c[1] };
        // 折线近似兜底：序号 i 在 stops 里的位置，映射到折线上等距取点
        const n = Math.max(stops.length, 1);
        const ratio = coords && coords.length ? i / (n - 1 || 1) : 0;
        const ci = Math.round(ratio * (coords.length - 1));
        const approx = coords[Math.min(Math.max(ci, 0), coords.length - 1)];
        return approx ? { name: nm, lng: approx[0], lat: approx[1] } : { name: nm, lng: null, lat: null };
      }));
      return {
        type: 'Feature',
        properties: {
          name,
          type: p.type || (mode === 'metro' ? '地铁' : '公交'),
          color: p.color || BUS_COLORS[idx % BUS_COLORS.length],
          start: p.start || '',
          end: p.end || '',
          stops: p.stops || [],
          stopInfoJson,
          km,
        },
        geometry: { type: 'LineString', coordinates: coords },
      };
    }),
  };
}

// 站点名 -> [lng, lat] 查找表（来自公交/地铁站点数据），供弹窗内点击站点飞行定位
// 名称相同则地铁站点优先（地标更精确、覆盖公交同名站）；无坐标的站也登记为 null 以区分「无此站」
// 取坐标优先级：properties.lng/lat > geometry.coordinates
function stationCoordsOf(f) {
  const p = (f && f.properties) || {};
  if (p && p.name != null && p.lng != null && p.lat != null) {
    return { name: String(p.name).trim(), lng: p.lng, lat: p.lat };
  }
  if (p && p.name != null && f.geometry && Array.isArray(f.geometry.coordinates)) {
    const c = f.geometry.coordinates;
    if (c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1])) {
      return { name: String(p.name).trim(), lng: c[0], lat: c[1] };
    }
  }
  if (p && p.name != null) return { name: String(p.name).trim(), lng: null, lat: null };
  return null;
}
const STATION_COORDS = (() => {
  const map = {};
  for (const data of [metroStopsData, busStopsData]) {
    if (!data || !data.features) continue;
    for (const f of data.features) {
      const s = stationCoordsOf(f);
      if (!s) continue;
      // 地铁优先：只有第一次（地铁）写入，公交遇到同名不再覆盖
      if (Object.prototype.hasOwnProperty.call(map, s.name)) continue;
      if (s.lng != null && s.lat != null) map[s.name] = [s.lng, s.lat];
      else map[s.name] = null; // 标记：站名存在但无坐标
    }
  }
  return map;
})();

// 站点 HTML 转义，防止站名中的特殊字符破坏弹窗结构
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function linePopupHTML(p) {
  // 优先解析线路源数据里预生成的「站名+坐标」JSON 字符串（见 buildLinesGeoJSON）。
  // 这样不依赖运行时按名字反查，避免 queryRenderedFeatures 把 stops 数组反序列化成字符串导致匹配失败。
  let stopItems = [];
  if (p.stopInfoJson) {
    try { stopItems = JSON.parse(p.stopInfoJson); } catch (e) { stopItems = []; }
  }
  if (!Array.isArray(stopItems) || !stopItems.length) {
    // 兜底：老数据没有 stopInfoJson，退回用 stops + 名字反查
    const stops = Array.isArray(p.stops) ? p.stops : String(p.stops || '').split(',').filter(Boolean);
    stopItems = stops.map((s) => {
      const nm = String(s).trim();
      const c = STATION_COORDS[nm];
      return c ? { name: nm, lng: c[0], lat: c[1] } : { name: nm, lng: null, lat: null };
    });
  }
  const stopChips = stopItems.map((it) => {
    const name = String(it && it.name ? it.name : '').trim();
    const has = it && it.lng != null && it.lat != null && Number.isFinite(Number(it.lng)) && Number.isFinite(Number(it.lat));
    if (!has) return `<span style="color:#ffd04b">${escapeHtml(name)}</span>`;
    return `<span class="jinan-station" data-lng="${it.lng}" data-lat="${it.lat}" title="点击飞往该站"
      style="color:#ffd04b;cursor:pointer;text-decoration:underline;text-underline-offset:2px">${escapeHtml(name)}</span>`;
  }).join(' <span style="color:#7a8aa0">→</span> ');
  const stopsLine = stopItems.length
    ? `<div>🚏 途经站点（${stopItems.length} 站，点击可定位）：<div class="jinan-stops" style="max-height:120px;overflow-y:auto;color:#ffd04b;line-height:1.9;padding-right:4px">${stopChips}</div></div>`
    : '';
  const headLine = p.start || p.end
    ? `<div>🔁 起讫站：<b style="color:#69d5ff">${p.start} ⇌ ${p.end}</b></div>`
    : '';
  return `
    <div style="font-family:'Microsoft YaHei',Arial,sans-serif;color:#fff;max-width:340px">
      <div style="font-size:14px;font-weight:bold;color:${p.color};margin-bottom:8px">${p.name}（${p.type}）</div>
      <div style="font-size:12px;line-height:1.8">
        ${headLine}
        <div>📏 线路全长：<b style="color:#9be15d">${p.km} 公里</b></div>
        ${stopsLine}
      </div>
    </div>`;
}

// 公交线路（Mapbox 原生图层，globe 投影下能正确贴合，L7 图层会按平面墨卡托错位）
function addBusLines() {
  const geojson = buildLinesGeoJSON(busLinesData.features, 'bus');
  if (!map.getSource('bus-lines')) map.addSource('bus-lines', { type: 'geojson', data: geojson });
  else map.getSource('bus-lines').setData(geojson);
  if (!map.getLayer('bus-lines')) {
    map.addLayer({
      id: 'bus-lines',
      type: 'line',
      source: 'bus-lines',
      paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': 0.9 },
    });
  }
}
function removeBusLines() {
  if (map.getLayer('bus-lines')) map.removeLayer('bus-lines');
  if (map.getSource('bus-lines')) map.removeSource('bus-lines');
}

// ============================================================

// ⑤ 实时公交（基于静态线网的前端“准实时”模拟：

//    车辆沿线路动态移动 + 站点到站时间预测 + 拥挤度提示）

// ============================================================

const busShowVehicles = ref(false);      // 是否显示实时车辆（图层控制开关）

const liveBusRunning = ref(false);       // 实时系统是否运行（控制图例显示）

const OCC_META = [

  { label: '空闲', color: '#2ecc71' },

  { label: '适中', color: '#ffa726' },

  { label: '拥挤', color: '#ef5350' }

];

const VEH_PER_LINE = 2;     // 每条线路同时在线车辆数

const VEH_SPEED = 7;        // 公交平均运营速度（米/秒，含停站）

const LIVE_TICK = 1200;     // 车辆位置刷新间隔（毫秒）

let busGeoCache = null;     // 线路弧长几何缓存

let liveVehicles = [];      // 车辆运行状态

let liveVehicleLayer = null;

let liveTimer = null;



// 两点球面距离（米）

function haversineM(a, b) {

  const R = 6371000, t = Math.PI / 180;

  const lat1 = a[1] * t, lat2 = b[1] * t;

  const dlat = (b[1] - a[1]) * t, dlng = (b[0] - a[0]) * t;

  const h = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));

}



// 惰性构建线路几何缓存：累计弧长，供按里程定位

function ensureBusGeoCache() {

  if (busGeoCache) return busGeoCache;

  busGeoCache = busLinesData.features.map(f => {

    const coords = f.geometry.coordinates || [];

    const cum = [0];

    for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + haversineM(coords[i - 1], coords[i]));

    return { name: f.properties.name, stops: f.properties.stops || [], coords, cum, total: cum[cum.length - 1] || 0 };

  }).filter(g => g.coords.length > 1 && g.total > 0);

  return busGeoCache;

}



// 沿线路走 dist 米处的坐标（相邻顶点间线性插值，二分定位段）

function pointAlong(g, dist) {

  if (dist <= 0) return g.coords[0];

  if (dist >= g.total) return g.coords[g.coords.length - 1];

  let lo = 0, hi = g.cum.length - 1;

  while (lo < hi) { const mid = (lo + hi) >> 1; if (g.cum[mid] < dist) lo = mid + 1; else hi = mid; }

  const i = Math.max(1, lo);

  const seg = g.cum[i] - g.cum[i - 1] || 1e-6;

  const r = (dist - g.cum[i - 1]) / seg;

  const a = g.coords[i - 1], b = g.coords[i];

  return [a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r];

}



// 站点在线路上的投影弧长（取距站点最近的线路顶点）

function stopArcOn(g, lng, lat) {

  let bestI = 0, bestD = Infinity;

  for (let i = 0; i < g.coords.length; i++) {

    const d = haversineM([lng, lat], g.coords[i]);

    if (d < bestD) { bestD = d; bestI = i; }

  }

  return g.cum[bestI];

}

// 站名归一化：去末尾数字/“站”，提高线网站名与站点图层的匹配率

const normStop = (n) => (n || '').replace(/[0-9]+$/, '').replace(/站$/, '').trim();

function rollOcc() { const r = Math.random(); return r < 0.4 ? 0 : (r < 0.8 ? 1 : 2); }



// 初始化全部车辆：均匀错开初始位置，随机客流与速度

function initLiveVehicles() {

  const cache = ensureBusGeoCache();

  liveVehicles = [];

  cache.forEach((g, li) => {

    for (let k = 0; k < VEH_PER_LINE; k++) {

      liveVehicles.push({

        li,

        pos: (k / VEH_PER_LINE) * g.total + Math.random() * g.total * 0.08,

        occ: rollOcc(),

        speed: VEH_SPEED * (0.8 + Math.random() * 0.5)

      });

    }

  });

}



function buildVehicleFeatures() {

  const cache = ensureBusGeoCache();

  return liveVehicles.map(v => {

    const g = cache[v.li];

    const c = pointAlong(g, v.pos);

    return {

      type: 'Feature',

      geometry: { type: 'Point', coordinates: c },

      properties: { img: 'live-bus-' + v.occ, lineName: g.name, occ: v.occ }

    };

  });

}



// 注册三种拥挤度配色的巴士图标

function ensureLiveVehicleImages() {

  OCC_META.forEach((m, i) => {

    if (scene.hasImage('live-bus-' + i)) return;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">

      <rect x="4" y="4" width="16" height="13" rx="3" fill="${m.color}" stroke="#ffffff" stroke-width="1.6"/>

      <rect x="6.5" y="6.5" width="11" height="4.6" rx="1" fill="rgba(255,255,255,.92)"/>

      <circle cx="8.6" cy="18.6" r="1.9" fill="#263238"/><circle cx="15.4" cy="18.6" r="1.9" fill="#263238"/>

    </svg>`;

    scene.addImage('live-bus-' + i, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));

  });

}



// 推进一个时间步：车辆沿里程前进，到终点回绕视为下一班并刷新客流

function stepVehicles(dtMs) {

  const cache = ensureBusGeoCache();

  liveVehicles.forEach(v => {

    const g = cache[v.li];

    v.pos += v.speed * dtMs / 1000;

    if (v.pos >= g.total) { v.pos -= g.total; v.occ = rollOcc(); }

  });

  if (liveVehicleLayer) liveVehicleLayer.setData({ type: 'FeatureCollection', features: buildVehicleFeatures() });

}



function startLiveBuses() {

  ensureBusGeoCache();

  ensureLiveVehicleImages();

  if (!liveVehicles.length) initLiveVehicles();

  if (!liveVehicleLayer) {

    liveVehicleLayer = new PointLayer({ zIndex: 6, name: 'live-buses' })

      .source({ type: 'FeatureCollection', features: buildVehicleFeatures() })

      .shape('img', v => v)

      .size(22);

    liveVehicleLayer.on('mousemove', e => {

      const p = e.feature && e.feature.properties;

      if (!p) return;

      if (hoverPopup) scene.removePopup(hoverPopup);

      const m = OCC_META[p.occ];

      hoverPopup = new Popup({ offsets: [0, -12], closeButton: false, closeOnClick: false })

        .setLnglat(e.lngLat)

        .setHTML(`<div style="font-size:12px;line-height:1.7"><b>🚌 ${p.lineName}</b><br/>运营中 · 拥挤度：<b style="color:${m.color}">${m.label}</b></div>`);

      scene.addPopup(hoverPopup);

    });

    liveVehicleLayer.on('mouseout', () => { if (hoverPopup) { scene.removePopup(hoverPopup); hoverPopup = null; } });

    scene.addLayer(liveVehicleLayer);

  }

  if (liveTimer) clearInterval(liveTimer);

  let last = Date.now();

  liveTimer = setInterval(() => { const now = Date.now(); stepVehicles(now - last); last = now; }, LIVE_TICK);

  liveBusRunning.value = true;

}



function stopLiveBuses() {

  if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }

  if (liveVehicleLayer) { scene.removeLayer(liveVehicleLayer); liveVehicleLayer = null; }

  liveBusRunning.value = false;

}



// 到站预测：找出经过该站的线路，计算线上最快车辆的剩余里程与时间

function predictBusesAtStop(stopName, lng, lat) {
  const cache = ensureBusGeoCache();
  const sn = normStop(stopName);
  const NEAR = 400; // 空间就近匹配半径（米）：站名对不上时，只要线路物理经过站点附近也算
  const out = [];
  cache.forEach((g, li) => {
    // 找该线路距站点最近的点：弧长 arc 与直线距离 nearD
    let nearD = Infinity, arc = -1;
    for (let i = 0; i < g.coords.length; i++) {
      const d = haversineM([lng, lat], g.coords[i]);
      if (d < nearD) { nearD = d; arc = g.cum[i]; }
    }
    // 站名命中优先；否则要求线路在站点 400m 内经过
    const byName = g.stops.some(x => {
      const xn = normStop(x);
      return xn === sn || (sn && (xn.includes(sn) || sn.includes(xn)));
    });
    if (!byName && nearD > NEAR) return;
    if (arc < 0) return;
    let best = Infinity, bestOcc = 1;
    liveVehicles.forEach(v => {
      if (v.li !== li) return;
      let rem = arc - v.pos;
      if (rem < 0) rem += g.total;
      if (rem < best) { best = rem; bestOcc = v.occ; }
    });
    if (isFinite(best)) {
      out.push({ name: g.name, etaMin: Math.max(1, Math.round(best / (VEH_SPEED * 60))), distM: Math.round(best), occ: bestOcc });
    }
  });
  return out.sort((a, b) => a.etaMin - b.etaMin).slice(0, 4);
}

// 点击公交站点：弹出下一班到站预测与拥挤度
function showBusStopPrediction(p) {
  // 图层控制中关闭“站点到站预测”后，点击站点仅显示站名
  if (!busStopPredict.value) {
    map.flyTo({ center: [p.lng, p.lat], zoom: 15, pitch: 25 });
    if (popup) scene.removePopup(popup);
    popup = new Popup({ closeButton: true, closeOnClick: true }).setLnglat([p.lng, p.lat]).setHTML('<span>🚏 ' + p.name + '</span>');
    scene.addPopup(popup);
    return;
  }
  map.flyTo({ center: [p.lng, p.lat], zoom: 15, pitch: 25 });
  if (popup) scene.removePopup(popup);
  // 实时车辆引擎未运行时自动启动，保证点站即可预测，无需先去图层控制手动开启
  if (!liveBusRunning.value) { busShowVehicles.value = true; startLiveBuses(); }
  const rows = predictBusesAtStop(p.name, p.lng, p.lat);
  let html;
  if (!rows.length) {
    html = `<div style="font-size:13px;min-width:180px"><b style="color:#ffd54f">🚏 ${p.name}</b><div style="color:#9fb3c8;font-size:12px;line-height:1.6;margin-top:4px">该站周边 400m 内暂无已开通实时公交的线路，可换个主干道站点试试</div></div>`;
  } else {
    const items = rows.map(r => {
      const m = OCC_META[r.occ];
      const soon = r.etaMin <= 2;
      return `<div style="display:flex;align-items:center;gap:6px;margin-top:6px;padding:5px 8px;background:rgba(255,255,255,.06);border-radius:7px">
        <b style="color:#5fe0ff;min-width:48px">${r.name}</b>
        <span style="color:${soon ? '#4ade80' : '#eaf6ff'}">${soon ? '即将到站' : '约 ' + r.etaMin + ' 分钟'}</span>
        <span style="color:#8fb0c8;font-size:11px">${(r.distM / 1000).toFixed(1)}km</span>
        <span style="margin-left:auto;font-size:11px;color:#fff;background:${m.color};border-radius:8px;padding:0 7px">${m.label}</span>
      </div>`;
    }).join('');
    html = `<div style="font-size:13px;min-width:250px"><b style="color:#ffd54f">🚏 ${p.name}</b><div style="font-size:11px;color:#8fb0c8;margin-top:2px">下一班实时到站预测（共 ${rows.length} 条线路）</div>${items}</div>`;
  }
  popup = new Popup({ closeButton: true, closeOnClick: true }).setLnglat([p.lng, p.lat]).setHTML(html);
  scene.addPopup(popup);
}



// ============================================================
// ⑥ 到站预测对话框 / 班次时刻表 / 收藏与历史（补全模板引用，消除未定义崩溃）
// ============================================================
// —— 实时公交到站预测：对话框按站名查询，复用⑤的实时车辆引擎 ——
const busArrivalDialog = ref(false);
const busArrivalStation = ref('');
const busArrivalLoading = ref(false);
const busArrivalData = ref(null);
const findStopByName = (kw) => {
  const norm = n => (n || '').replace(/[0-9]+$/, '').trim();
  const list = busStopsData.features;
  return list.find(f => f.properties.name === kw)
    || list.find(f => f.properties.name.includes(kw) || kw.includes(f.properties.name))
    || list.find(f => norm(f.properties.name) === norm(kw));
};
const queryBusArrival = () => {
  const kw = busArrivalStation.value.trim();
  if (!kw) { ElMessage.warning('请输入站点名称'); return; }
  busArrivalLoading.value = true;
  setTimeout(() => {
    const f = findStopByName(kw);
    if (!f) { busArrivalData.value = { station: kw, arrivals: [] }; busArrivalLoading.value = false; ElMessage.info('未找到该站点'); return; }
    // 实时引擎未运行时先启动，保证有车辆状态可预测
    if (!liveBusRunning.value) { busShowVehicles.value = true; startLiveBuses(); }
    const p = f.properties;
    const rows = predictBusesAtStop(p.name, p.lng, p.lat);
    const nowH = new Date().getHours();
    const isPeak = (nowH >= 7 && nowH <= 9) || (nowH >= 17 && nowH <= 19);
    const crowdText = ['空闲', '适中', '拥挤'];
    const arrivals = rows.map(r => {
      const lf = busLinesData.features.find(x => x.properties.name === r.name);
      const sch = lf ? lineSchedule(lf) : { first_bus: '06:00', last_bus: '21:30', interval_min: 10 };
      return {
        line_name: r.name, eta_min: r.etaMin, crowd: crowdText[r.occ],
        interval_min: sch.interval_min, first_bus: sch.first_bus, last_bus: sch.last_bus
      };
    });
    busArrivalData.value = { station: p.name, is_peak: isPeak, arrivals };
    busArrivalStation.value = p.name;
    busArrivalLoading.value = false;
  }, 250);
};
const flyToArrivalStation = () => {
  const name = busArrivalData.value && busArrivalData.value.station;
  const f = name && findStopByName(name);
  if (f) { map.flyTo({ center: [f.properties.lng, f.properties.lat], zoom: 15 }); busArrivalDialog.value = false; }
};

// —— 班次时刻表：基于线网生成稳定（按线路名哈希）的模拟运营时刻 ——
const scheduleDialog = ref(false);
const scheduleLine = ref('');
const scheduleLoading = ref(false);
const scheduleList = ref([]);
const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const p2n = (n) => String(n).padStart(2, '0');
function lineSchedule(f) {
  const pr = f.properties, h = hashStr(pr.name);
  const interval = 6 + h % 9, interval_peak = Math.max(3, interval - 3);
  const notes = ['平峰约' + interval + '分钟一班', '高峰缩短发车间隔', '途经主要客流走廊', '夜间班次间隔适当延长'];
  return {
    first_bus: p2n(5 + (h % 2)) + ':' + p2n((h * 13) % 60),
    last_bus: p2n(20 + (h % 3)) + ':' + p2n((h * 17) % 60),
    interval_min: interval, interval_peak, note: notes[h % notes.length]
  };
}
const querySchedules = () => {
  scheduleLoading.value = true;
  const kw = scheduleLine.value.trim().replace(/^K/i, '');
  setTimeout(() => {
    const list = busLinesData.features
      .filter(f => !kw || f.properties.name.includes(kw) || ('K' + f.properties.name).includes(kw))
      .map((f, i) => {
        const pr = f.properties, sch = lineSchedule(f);
        return { id: i, line_name: pr.name, direction: (pr.start || '') + ' → ' + (pr.end || ''), ...sch };
      });
    scheduleList.value = list.slice(0, 80);
    scheduleLoading.value = false;
    if (!scheduleList.value.length) ElMessage.info('未找到匹配线路');
    else ElMessage.success('共 ' + scheduleList.value.length + ' 条线路班次');
  }, 200);
};

// —— 收藏与搜索历史（localStorage 持久化）——
const FAV_KEY = 'jncity_favorites', HIST_KEY = 'jncity_history';
function safeParseArr(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } }
const favDialog = ref(false);
const favTab = ref('favorites');
const favList = ref(safeParseArr(FAV_KEY));
const historyList = ref(safeParseArr(HIST_KEY));
const persistFav = () => localStorage.setItem(FAV_KEY, JSON.stringify(favList.value));
const persistHist = () => localStorage.setItem(HIST_KEY, JSON.stringify(historyList.value));
const openFavDialog = () => { favDialog.value = true; };
const removeFavorite = (id) => { favList.value = favList.value.filter(f => f.id !== id); persistFav(); ElMessage.success('已取消收藏'); };
const clearHistory = () => { historyList.value = []; persistHist(); ElMessage.success('已清空搜索历史'); };
const addFavorite = (name, type = 'route') => {
  if (!name) return;
  if (favList.value.some(f => f.name === name)) { ElMessage.info('已在收藏列表中'); return; }
  favList.value.unshift({ id: 'f' + Date.now(), type, name, created_at: new Date().toISOString() });
  persistFav(); ElMessage.success('已收藏：' + name);
};
const addHistory = (query_text, type = 'transit') => {
  if (!query_text) return;
  historyList.value = historyList.value.filter(h => h.query_text !== query_text);
  historyList.value.unshift({ id: 'h' + Date.now(), query_text, type, created_at: new Date().toISOString() });
  historyList.value = historyList.value.slice(0, 30);
  persistHist();
};

// —— 顶部公告通知（静态运营公告，定时轮播，点击打开全部）——
const announceDialog = ref(false);
const announcements = ref([
  { id: 1, type: 'alert', priority: 'high', title: '早晚高峰拥堵提醒', content: '工作日 7:30-9:00、17:30-19:00 经十路、北园高架、二环南高架车流较大，建议错峰或优先选择地铁、公交出行。', created_at: new Date().toISOString() },
  { id: 2, type: 'adjustment', priority: 'mid', title: '道路施工与绕行提示', content: '市区部分主次干道开展养护施工，途经车辆请按现场交通标志减速慢行，或提前规划绕行路线。', created_at: new Date().toISOString() },
  { id: 3, type: 'other', priority: 'low', title: '绿色出行与实时公交', content: '公交地铁接驳可享换乘优惠；平台已上线实时公交到站预测，点击公交站点即可查看下一班到站时间与拥挤度。', created_at: new Date().toISOString() }
]);
const currentAnnounce = ref('');
(function initAnnounce() {
  const build = (a) => '📢 ' + a.title + '：' + a.content;
  if (announcements.value.length) currentAnnounce.value = build(announcements.value[0]);
  let ai = 0;
  setInterval(() => {
    if (!announcements.value.length) return;
    ai = (ai + 1) % announcements.value.length;
    currentAnnounce.value = build(announcements.value[ai]);
  }, 6000);
})();

// —— 收藏当前规划路线 ——
const favCurrentRoute = () => {
  if (!routeInfo.value) { ElMessage.info('请先规划一条路线'); return; }
  const name = (originName.value || '起点') + ' → ' + (destName.value || '终点') + '（' + travelMode.value + '，约' + routeInfo.value.duration + '分钟）';
  addFavorite(name, 'route');
};

// 站点到站预测开关（关闭后点击站点只显示站名）
const busStopPredict = ref(true);

// 按“起点 → 终点（模式，..）”文本重新载入并规划路线
const replayByName = async (nameStr) => {
  const m = (nameStr || '').match(/^(.+?)\s*→\s*(.+?)（(.+?)[，,]/);
  if (!m) { ElMessage.warning('该记录缺少起终点信息'); return; }
  const oname = m[1].trim(), dname = m[2].trim(), mode = m[3].trim();
  originName.value = oname; destName.value = dname;
  travelMode.value = ['综合', '地铁优先', '公交', '驾车', '步行'].includes(mode) ? mode : '综合';
  originPicked.value = null; destPicked.value = null;
  transitVisible.value = true;
  const findLM = (n) => landmarks.find(l => l.name === n);
  const geo = async (name) => {
    const u = '/amap/v3/geocode/geo?address=' + encodeURIComponent(name) + '&city=370100&key=f752ae50b3478617343635244aa5c843';
    try {
      const j = await (await fetch(u)).json();
      if (j.status === '1' && j.geocodes && j.geocodes[0]) {
        const [lng, lat] = j.geocodes[0].location.split(',').map(Number);
        const [wLng, wLat] = gcj2wgs(lng, lat);
        return { lng: wLng, lat: wLat };
      }
    } catch (e) { /* 忽略，走兜底 */ }
    return null;
  };
  let o = findLM(oname), d = findLM(dname);
  if (!o) o = await geo(oname);
  if (!d) d = await geo(dname);
  if (!o || !d) { ElMessage.warning('该路线起终点已无法定位，请重新规划'); return; }
  originPicked.value = findLM(oname) ? null : o;
  destPicked.value = findLM(dname) ? null : d;
  queryTransit();
  ElMessage.success('已载入路线：' + oname + ' → ' + dname);
};
// 点击收藏项：路线重新规划，站点则飞行定位
const applyFavorite = (f) => {
  favDialog.value = false;
  if (f.type === 'stop') {
    const st = findStopByName(f.name);
    if (st) map.flyTo({ center: [st.properties.lng, st.properties.lat], zoom: 15 });
    return;
  }
  replayByName(f.name);
};


// 地铁线路（Mapbox 原生图层）—— 加光晕底层 + 置顶到公交线之上，避免被盖住
function addMetroLines() {
  const geojson = buildLinesGeoJSON(metroLinesData.features, 'metro');
  if (!map.getSource('metro-lines')) map.addSource('metro-lines', { type: 'geojson', data: geojson });
  else map.getSource('metro-lines').setData(geojson);
  if (!map.getLayer('metro-lines-glow')) {
    map.addLayer({
      id: 'metro-lines-glow',
      type: 'line',
      source: 'metro-lines',
      paint: { 'line-color': ['get', 'color'], 'line-width': 11, 'line-opacity': 0.28, 'line-blur': 2 },
    });
  }
  if (!map.getLayer('metro-lines')) {
    map.addLayer({
      id: 'metro-lines',
      type: 'line',
      source: 'metro-lines',
      paint: { 'line-color': ['get', 'color'], 'line-width': 5, 'line-opacity': 0.95 },
    });
  }
  // 置顶到公交线之上，避免地铁线被公交线盖住
  if (map.getLayer('bus-lines')) {
    map.moveLayer('metro-lines-glow');
    map.moveLayer('metro-lines');
  }
}
function removeMetroLines() {
  if (map.getLayer('metro-lines')) map.removeLayer('metro-lines');
  if (map.getLayer('metro-lines-glow')) map.removeLayer('metro-lines-glow');
  if (map.getSource('metro-lines')) map.removeSource('metro-lines');
}

let lineHoverPopup = null;
const closeLineHover = () => { if (lineHoverPopup) { lineHoverPopup.remove(); lineHoverPopup = null; } };

// 在线路图层的悬停/点击弹窗改用「按像素查询」实现：
// globe 投影 + L7 包裹的地图下，mapbox 的图层级事件（('mousemove','bus-lines')）内部依赖
// queryRenderedFeatures 与图层耦合，容易不触发；改为在地图任何位置查询光标处的线路再判断。
// 查询误差容差：鼠标无需精确压在线条上，稍偏一点也能命中，手感更友好。
// 只查询当前真实存在的线路图层：queryRenderedFeatures 对不存在的图层会直接抛错
const LINE_LAYERS = ['bus-lines', 'metro-lines'];
function queryLineAt(e) {
  if (typeof map.queryRenderedFeatures !== 'function') return null;
  const existing = LINE_LAYERS.filter((id) => !!map.getLayer(id));
  if (!existing.length) return null;
  let features;
  try {
    features = map.queryRenderedFeatures(e.point, { layers: existing });
  } catch (err) {
    return null; // 图层在查询瞬间被移除等情况，忽略
  }
  return (features && features[0]) || null;
}

// 弹窗内站点点击 -> 飞行定位。mapbox 的 Popup 每次 setHTML 都会销毁并重建内部 DOM，
// 把委托监听到冒泡的 document 层最可靠（弹窗 DOM 一定会在 document 上），
// 命中 .jinan-station 才处理，避免与地图自身的 click 冲突。
const flyPopupToStation = (el) => {
  const target = el && el.closest && el.closest('.jinan-station');
  if (!target || !map || typeof map.easeTo !== 'function') return;
  const lng = parseFloat(target.getAttribute('data-lng'));
  const lat = parseFloat(target.getAttribute('data-lat'));
  if (Number.isNaN(lng) || Number.isNaN(lat)) return;
  const name = (target.textContent || '').trim();
  // 让点击不掉进地图本身的事件（避免又触发线路点击弹窗），并关闭悬停弹窗
  map.easeTo({ center: [lng, lat], zoom: 15, pitch: 45, duration: 1800 });
  closeLineHover();
  if (ElMessage && name) ElMessage.success(`正在飞往站点：${name}`);
};
// 事件委托挂到 document（一次性），随 mapbox 各自弹窗的 setHTML 重建 DOM 也能命中
document.addEventListener('click', (e) => flyPopupToStation(e.target));

// 光标移到可点击站名上时提示可点（直接用原生事件拿 currentTarget，比 mapbox 的 mouse 事件稳）
document.addEventListener('mousemove', (e) => {
  const t = e.target;
  const isStation = !!(t && t.closest && t.closest('.jinan-station'));
  if (map && map.getCanvas()) map.getCanvas().style.cursor = isStation ? 'pointer' : '';
});

// 鼠标悬停 -> 实时弹出线路信息（跟随鼠标）
map.on('mousemove', (e) => {
  if (!e.point) return;
  const f = queryLineAt(e);
  if (!f) {
    map.getCanvas().style.cursor = '';
    closeLineHover();
    return;
  }
  map.getCanvas().style.cursor = 'pointer';
  if (lineHoverPopup) lineHoverPopup.setLngLat(e.lngLat).setHTML(linePopupHTML(f.properties));
  else lineHoverPopup = new mapboxgl.Popup({ closeButton: false, offset: 10, className: 'flow-popup' })
    .setLngLat(e.lngLat).setHTML(linePopupHTML(f.properties)).addTo(map);
});

// 点击线路 -> 弹出 线路详情（closeButton 关闭），地图选点模式下不干扰
map.on('click', (e) => {
  if (picking.value) return; // 选点中不弹线路框
  if (!e.point) return;
  const f = queryLineAt(e);
  if (!f) return;
  closeLineHover();
  new mapboxgl.Popup({ closeButton: true, offset: 10, className: 'flow-popup' })
    .setLngLat(e.lngLat)
    .setHTML(linePopupHTML(f.properties))
    .addTo(map);
});

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
const routeDetailDialog = ref(false);
const routeDetail = ref(null);
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
  // 驾车 / 步行走独立的高德接口
  if (travelMode.value === '驾车' || travelMode.value === '步行') {
    queryDriveOrWalk(o, d);
    return;
  }
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
      // 解析单个换乘方案为可绘制数据
      const parseTransit = (transit) => {
        const coords = [];
        const busNames = [];
        const stops = [];
        const pushStop = (s) => {
          if (s && s.location) {
            const [lng, lat] = s.location.split(',').map(Number);
            const [wlng, wlat] = gcj2wgs(lng, lat);
            stops.push({ name: s.name, lng: wlng, lat: wlat });
          }
        };
        for (const seg of transit.segments) {
          if (seg.bus && seg.bus.buslines && seg.bus.buslines.length) {
            const bl = seg.bus.buslines[0];
            busNames.push(bl.type === '地铁线路' ? '🚇' + bl.name : bl.name);
            coords.push(...polyline2wgs(bl.polyline));
            pushStop(bl.departure_stop);
            (bl.via_stops || []).forEach(pushStop);
            pushStop(bl.arrival_stop);
          }
          if (seg.railway && (seg.railway.name || (seg.railway.lines && seg.railway.lines.length))) {
            const rw = seg.railway;
            const lineName = rw.name || (rw.lines && rw.lines[0] && rw.lines[0].name) || '地铁';
            busNames.push(lineName);
            if (rw.lines && rw.lines.length) rw.lines.forEach(line => { if (line.polyline) coords.push(...polyline2wgs(line.polyline)); });
            pushStop(rw.departure_stop);
            (rw.via_stops || []).forEach(pushStop);
            pushStop(rw.arrival_stop);
          }
        }
        return {
          coords, stops, busNames,
          duration: Math.round(transit.duration / 60),
          distance: Number(transit.distance || route.distance || 0),
          walk: Number(transit.walking_distance || 0),
          cost: transit.cost
        };
      };
      let transits = route.transits.slice(0, 5);
      // 地铁优先：含地铁的方案排前面
      if (travelMode.value === '地铁优先') {
        const hasMetro = (t) => t.segments && t.segments.some(s => s.bus && s.bus.buslines && s.bus.buslines.some(bl => bl.type === '地铁线路'));
        transits = transits.slice().sort((a, b) => (hasMetro(b) ? 1 : 0) - (hasMetro(a) ? 1 : 0));
      }
      const prefix = travelMode.value === '地铁优先' ? '地铁路线' : '公交方案';
      const alts = transits.map((tt, i) => {
        const q = parseTransit(tt);
        return {
          kind: 'transit', name: prefix + (i + 1),
          duration: q.duration, distance: q.distance,
          sub: '步行' + (q.walk / 1000).toFixed(1) + 'km · ' + (q.cost ? (q.cost + '元') : '免费') + ' · ' + (q.busNames.length ? q.busNames.join('、') : '步行直达'),
          coords: q.coords, stops: q.stops, busNames: q.busNames
        };
      }).filter(a => a.coords.length);
      if (!alts.length) { ElMessage.error('未解析到可用公交方案'); return; }
      tagAlts(alts);
      routeOD = { o, d };
      routeAlts.value = alts;
      selectedAlt.value = 0;
      drawRouteAlt(0);
      ElMessage.success('共查询到 ' + alts.length + ' 条公共交通方案，可在对话框切换');
      addHistory((originName.value || '起点') + ' → ' + (destName.value || '终点') + '（公共交通）', 'transit');
    })
    .catch(err => {
      console.error('路线查询失败:', err);
      ElMessage.error('路线查询失败：' + (err && err.message ? err.message : err));
    });
};

map.on('click', 'transit-route-line', () => { openRouteDetail(); });
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

// 地图选点：统一处理（谁先触发谁处理，并立即清空 picking，天然防重复）
const pickOnMap = (lng, lat) => {
  const which = picking.value;
  if (!which) return;
  const label = `${Number(lng).toFixed(5)}, ${Number(lat).toFixed(5)}`;
  if (which === 'report') {
    reportForm.value.lng = lng;
    reportForm.value.lat = lat;
    reverseGeocode(lng, lat);
    reportDialogVisible.value = true;
  } else if (which === 'poi') {
    poiCenter.value = { lng, lat, label };
    poiDialogVisible.value = true;
  } else if (which === 'origin') {
    originPicked.value = { lng, lat, label };
    transitVisible.value = true;
  } else {
    destPicked.value = { lng, lat, label };
    transitVisible.value = true;
  }
  picking.value = null;
};
// 通道一：mapbox 原生点击
map.on('click', (e) => { if (e.lngLat) pickOnMap(e.lngLat.lng, e.lngLat.lat); });
// 通道二：L7 scene 点击（公交等 L7 图层遮挡 mapbox canvas 时仍能选点）
scene.on('click', (e) => {
  if (!picking.value) return;
  const ll = e && e.lngLat;
  if (ll && ll.lng != null && ll.lat != null) pickOnMap(ll.lng, ll.lat);
});

// 全览：跳转到整条路线的视野，并自动关闭对话框
const overviewRoute = () => {
  if (routeBounds.value) {
    map.fitBounds(routeBounds.value, { padding: 80, duration: 1000 });
  }
  transitVisible.value = false;
};

// ============================================================
// ① 实时路况图层（高德交通态势 rectangle，按当前视野绘制拥堵道路）
// ============================================================
const trafficOn = ref(false);
const trafficSummary = ref('');
let trafficTimer = null;
const TRAFFIC_SOURCE = 'jinan-traffic';
const trafficStatusExpr = ['match', ['get', 'status'], 1, '#31c45a', 2, '#ffb300', 3, '#ff7043', '#e53935'];

function ensureTrafficLayers() {
  if (!map.getSource(TRAFFIC_SOURCE)) {
    map.addSource(TRAFFIC_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }
  if (!map.getLayer('jinan-traffic-glow')) {
    map.addLayer({
      id: 'jinan-traffic-glow', type: 'line', source: TRAFFIC_SOURCE,
      paint: { 'line-width': 10, 'line-opacity': 0.22, 'line-blur': 4, 'line-color': trafficStatusExpr }
    });
  }
  if (!map.getLayer('jinan-traffic-line')) {
    map.addLayer({
      id: 'jinan-traffic-line', type: 'line', source: TRAFFIC_SOURCE,
      paint: { 'line-width': 5, 'line-opacity': 0.95, 'line-color': trafficStatusExpr }
    });
  }
}

async function fetchTraffic() {
  if (!trafficOn.value) return;
  // 高德矩形查询对角线不能超过 10km，以地图中心为中心取约 8km 见方
  const c = map.getCenter();
  const [gcLng, gcLat] = wgs2gcj(c.lng, c.lat);
  const halfLng = 0.035, halfLat = 0.028;
  const rect = `${(gcLng - halfLng).toFixed(6)},${(gcLat - halfLat).toFixed(6)};${(gcLng + halfLng).toFixed(6)},${(gcLat + halfLat).toFixed(6)}`;
  const url = `/amap/v3/traffic/status/rectangle?rectangle=${rect}&level=5&extensions=all&key=f752ae50b3478617343635244aa5c843`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== '1') {
      ElMessage.warning('路况获取失败：' + (data.info || '') + '（' + (data.infocode || '') + '）');
      return;
    }
    const tinfo = data.trafficinfo || {};
    const roads = tinfo.roads || [];
    trafficSummary.value = tinfo.evaluation
      ? `当前区域：${tinfo.evaluation.description}　畅通 ${tinfo.evaluation.expedite} / 缓行拥堵 ${tinfo.evaluation.congested}`
      : '';
    const features = [];
    roads.forEach(road => {
      if (!road.polyline) return;
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: polyline2wgs(road.polyline) },
        properties: { name: road.name, status: Number(road.status), direction: road.direction || '' }
      });
    });
    if (map.getSource(TRAFFIC_SOURCE)) {
      map.getSource(TRAFFIC_SOURCE).setData({ type: 'FeatureCollection', features });
    }
  } catch (err) {
    console.error('路况请求失败：', err);
  }
}

let trafficHoverPopup = null;
let trafficHoverBinded = false;
const TRAFFIC_STATUS_TEXT = { 1: '畅通', 2: '缓行', 3: '拥堵', 4: '严重拥堵' };
const TRAFFIC_STATUS_COLOR = { 1: '#31c45a', 2: '#ffb300', 3: '#ff7043', 4: '#e53935' };
function bindTrafficHover() {
  if (trafficHoverBinded) return;
  trafficHoverBinded = true;
  map.on('mousemove', (e) => {
    if (!trafficOn.value || !map.getLayer('jinan-traffic-line')) return;
    const f = map.queryRenderedFeatures(e.point, { layers: ['jinan-traffic-line'] })[0];
    if (f) {
      const st = f.properties.status;
      const color = TRAFFIC_STATUS_COLOR[st] || '#999';
      if (!trafficHoverPopup) trafficHoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 12 });
      trafficHoverPopup.setLngLat(e.lngLat).setHTML(
        `<div style="font-size:12px;line-height:1.7"><b>${f.properties.name || '道路'}</b><br/>状态：<b style="color:${color}">${TRAFFIC_STATUS_TEXT[st] || '未知'}</b>${f.properties.direction ? '<br/>' + f.properties.direction : ''}</div>`
      ).addTo(map);
      map.getCanvas().style.cursor = 'pointer';
    } else if (trafficHoverPopup) {
      trafficHoverPopup.remove();
      map.getCanvas().style.cursor = '';
    }
  });
}

function removeTrafficLayers() {
  ['jinan-traffic-line', 'jinan-traffic-glow'].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
  if (map.getSource(TRAFFIC_SOURCE)) map.removeSource(TRAFFIC_SOURCE);
}

const toggleTraffic = () => {
  if (trafficOn.value) {
    trafficOn.value = false;
    trafficSummary.value = '';
    if (trafficTimer) { clearInterval(trafficTimer); trafficTimer = null; }
    removeTrafficLayers();
    if (trafficHoverPopup) trafficHoverPopup.remove();
    ElMessage.success('已关闭实时路况');
  } else {
    trafficOn.value = true;
    ensureTrafficLayers();
    bindTrafficHover();
    fetchTraffic();
    trafficTimer = setInterval(fetchTraffic, 60000);
    ElMessage.success('实时路况已开启：绿畅通 / 黄缓行 / 橙拥堵 / 红严重拥堵，每60秒刷新');
  }
};

// ============================================================
// ② 交通事件上报（选点 -> 表单 -> SQL Server；已上报事件在地图标记）
// ============================================================
const EVENT_TYPES = [
  { value: 'accident', label: '交通事故', color: '#e53935', icon: '🚗', char: '事' },
  { value: 'construction', label: '道路施工', color: '#fb8c00', icon: '🚧', char: '工' },
  { value: 'congestion', label: '交通拥堵', color: '#f9a825', icon: '🐢', char: '堵' },
  { value: 'control', label: '交通管制', color: '#8e24aa', icon: '⛔', char: '管' }
];
const formatTime = (t) => {
  try {
    const d = new Date(t);
    if (isNaN(d.getTime())) return t || '';
    const p2 = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
  } catch (e) { return t || ''; }
};
const eventTypeMap = Object.fromEntries(EVENT_TYPES.map(t => [t.value, t]));
const reportDialogVisible = ref(false);
const reportForm = ref({ type: 'accident', level: 2, address: '', description: '', lng: null, lat: null });
const reportedEvents = ref([]);
let reportEventsLayer = null;
const eventDetail = ref(null); // 当前查看的事件详情（固定卡片）

const startReport = () => {
  picking.value = 'report';
  ElMessage.info('请在地图上点击事件发生位置');
};

// 逆地理编码：WGS84 -> 高德 GCJ02 -> 地址文本
const reverseGeocode = (lng, lat) => {
  const [glng, glat] = wgs2gcj(lng, lat);
  fetch(`/amap/v3/geocode/regeo?location=${glng},${glat}&key=f752ae50b3478617343635244aa5c843`)
    .then(r => r.json())
    .then(d => { if (d.status === '1' && d.regeocode) reportForm.value.address = d.regeocode.formatted_address || ''; })
    .catch(() => {});
};

const resetReportForm = () => {
  reportForm.value = { type: 'accident', level: 2, address: '', description: '', lng: null, lat: null };
};

const submitReport = async () => {
  const f = reportForm.value;
  if (f.lng == null || f.lat == null) { ElMessage.warning('请先在地图上选择事件位置'); return; }
  let username = '匿名用户';
  try { username = localStorage.getItem('username') || '匿名用户'; } catch (e) {}
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: f.type, level: f.level, lng: f.lng, lat: f.lat,
        address: f.address, description: f.description, username
      })
    });
    const data = await res.json();
    if (data.code !== 0) { ElMessage.error(data.msg || '上报失败'); return; }
    ElMessage.success('交通事件上报成功');
    reportDialogVisible.value = false;
    resetReportForm();
    loadReportedEvents();
  } catch (err) {
    ElMessage.error('上报失败：' + err.message);
  }
};

async function loadReportedEvents() {
  try {
    const res = await fetch('/api/events');
    const data = await res.json();
    if (data.code !== 0) return;
    reportedEvents.value = data.data || [];
    renderReportedEvents();
  } catch (err) { console.error('事件列表加载失败：', err); }
}

function renderReportedEvents() {
  if (reportEventsLayer) { scene.removeLayer(reportEventsLayer); reportEventsLayer = null; }
  if (!reportedEvents.value.length) return;
  ensureMarkerImages();
  const features = reportedEvents.value.map(ev => {
    const t = eventTypeMap[ev.type] || {};
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [ev.lng, ev.lat] },
      properties: {
        lng: ev.lng, lat: ev.lat, id: ev.id, type: ev.type,
        typeLabel: t.label || '交通事件', iconChar: t.icon || '', color: t.color || '#e53935',
        level: Number(ev.level), address: ev.address || '未命名位置',
        description: ev.description || '', username: ev.username || '匿名',
        createdAt: ev.created_at || '', img: 'ev-' + ev.type
      }
    };
  });
  reportEventsLayer = new PointLayer({ zIndex: 6 })
    .source({ type: 'FeatureCollection', features })
    .shape('img', v => v)
    .size('level', l => 22 + Number(l) * 4);
  reportEventsLayer.on('mousemove', e => {
    const p = e.feature && e.feature.properties;
    if (!p) return;
    const levelText = ['', '一般', '较重', '严重'][p.level] || p.level;
    if (hoverPopup) scene.removePopup(hoverPopup);
    hoverPopup = new Popup({ offsets: [0, -14], closeButton: false, closeOnClick: false })
      .setLnglat(e.lngLat)
      .setHTML(`<div style="font-size:12px;line-height:1.7"><b style="color:${p.color}">${p.iconChar} ${p.typeLabel}</b><br/>${p.address}<br/>严重程度：${levelText}</div>`);
    scene.addPopup(hoverPopup);
  });
  reportEventsLayer.on('mouseout', () => {
    if (hoverPopup) { scene.removePopup(hoverPopup); hoverPopup = null; }
  });
  reportEventsLayer.on('click', e => {
    const p = e.feature && e.feature.properties;
    if (!p) return;
    if (hoverPopup) { scene.removePopup(hoverPopup); hoverPopup = null; }
    // 用固定详情卡片承载信息与「移除」按钮，避免 L7 Popup 移动即关闭、按钮点不到
    eventDetail.value = {
      id: p.id, typeLabel: p.typeLabel, iconChar: p.iconChar, color: p.color,
      levelText: ['', '一般', '较重', '严重'][p.level] || p.level,
      address: p.address, description: p.description, username: p.username,
      createdAt: p.createdAt ? formatTime(p.createdAt) : '', lng: p.lng, lat: p.lat
    };
    map.flyTo({ center: [p.lng, p.lat], zoom: 15, pitch: 30 });
  });
  scene.addLayer(reportEventsLayer);
}

// 清除地图上的全部事件标点（仅清除显示，不删除数据库记录）
const clearReportedEvents = () => {
  if (reportEventsLayer) { scene.removeLayer(reportEventsLayer); reportEventsLayer = null; }
  reportedEvents.value = [];
  eventDetail.value = null;
  if (popup) { scene.removePopup(popup); popup = null; }
  if (hoverPopup) { scene.removePopup(hoverPopup); hoverPopup = null; }
  ElMessage.success('已清除全部事件标点');
};

// 选择性移除单个事件标点（仅去掉该点前端显示，不删除数据库记录）
const removeOneEvent = (id) => {
  const before = reportedEvents.value.length;
  reportedEvents.value = reportedEvents.value.filter(ev => String(ev.id) !== String(id));
  if (reportedEvents.value.length === before) return;
  if (popup) { scene.removePopup(popup); popup = null; }
  renderReportedEvents();
  ElMessage.success('已移除该事件标点' + (reportedEvents.value.length ? '，剩余 ' + reportedEvents.value.length + ' 个' : '，已全部移除'));
};

// 详情卡片上点「移除该标点」
const removeCurrentEvent = () => {
  if (!eventDetail.value) return;
  const id = eventDetail.value.id;
  eventDetail.value = null;
  removeOneEvent(id);
};

// ============================================================
// ③ 驾车 / 步行路径规划（高德 driving / walking，复用 transit-route 图层）
// ============================================================
// ===== 多备选路线（驾车多策略 / 公交多换乘，统一卡片选择）=====
const routeAlts = ref([]); // 全部备选方案
const selectedAlt = ref(0);
let routeOD = null;

// 方案打标签：第1条推荐，并标注用时/距离最短
const tagAlts = (alts) => {
  let minDur = 0, minDist = 0;
  alts.forEach((a, i) => {
    if (a.duration < alts[minDur].duration) minDur = i;
    if (Number(a.distance) < Number(alts[minDist].distance)) minDist = i;
  });
  alts.forEach((a, i) => {
    const tags = [];
    if (i === 0) tags.push('推荐');
    if (i === minDur && alts.length > 1) tags.push('用时最短');
    if (i === minDist && alts.length > 1 && i !== minDur) tags.push('距离最短');
    a.badge = tags.join('·');
  });
};

// 统一绘制路线（公交带途经站，驾车/步行不带）
const paintRoute = (coords, stopPoints, lineColor, o, d) => {
  const geojson = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [o.lng, o.lat] }, properties: { kind: 'start' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [d.lng, d.lat] }, properties: { kind: 'end' } },
      ...stopPoints.map(s => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [s.lng, s.lat] }, properties: { kind: 'stop', name: s.name } }))
    ]
  };
  if (map.getSource('transit-route')) map.getSource('transit-route').setData(geojson);
  else map.addSource('transit-route', { type: 'geojson', data: geojson });
  if (!map.getLayer('transit-route-glow')) {
    map.addLayer({ id: 'transit-route-glow', type: 'line', source: 'transit-route', paint: { 'line-color': lineColor, 'line-width': 14, 'line-opacity': 0.25, 'line-blur': 6 } });
  } else map.setPaintProperty('transit-route-glow', 'line-color', lineColor);
  if (!map.getLayer('transit-route-line')) {
    map.addLayer({ id: 'transit-route-line', type: 'line', source: 'transit-route', paint: { 'line-color': lineColor, 'line-width': 5, 'line-opacity': 1 } });
  } else map.setPaintProperty('transit-route-line', 'line-color', lineColor);
  if (!map.getLayer('transit-route-points')) {
    map.addLayer({
      id: 'transit-route-points', type: 'circle', source: 'transit-route', filter: ['==', '$type', 'Point'],
      paint: {
        'circle-radius': ['match', ['get', 'kind'], 'start', 10, 'end', 10, 6],
        'circle-color': ['match', ['get', 'kind'], 'start', '#00ff88', 'end', '#ff3131', '#ffb300'],
        'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff'
      }
    });
  }
  ['transit-route-glow', 'transit-route-line', 'transit-route-points'].forEach(id => { if (map.getLayer(id)) map.moveLayer(id); });
};

// 绘制第 idx 条方案（驾车/公交通用）
const drawRouteAlt = (idx) => {
  const a = routeAlts.value[idx];
  if (!a || !routeOD) return;
  selectedAlt.value = idx;
  const { o, d } = routeOD;
  const mode = travelMode.value;
  const lineColor = a.kind === 'transit' ? '#00d4ff' : (mode === '驾车' ? '#ff9800' : '#4caf50');
  const coords = a.coords;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  if (coords.length) routeBounds.value = [[minLng, minLat], [maxLng, maxLat]];
  if (a.kind === 'drive') {
    routeInfo.value = { duration: a.duration, distance: a.distance, description: mode + ' · ' + a.name, stops: [], driveSteps: a.steps, tfLevel: null, tfTime: null, traffic: a.traffic || [], tolls: a.tolls, lights: a.lights };
    paintRoute(coords, [], lineColor, o, d);
  } else {
    const idealMin = a.duration;
    let tf = 'fast';
    if (idealMin >= 40) tf = 'congestion';
    else if (idealMin >= 25) tf = 'slow';
    routeInfo.value = { duration: idealMin, distance: a.distance, description: a.busNames.join(' → ') || '步行直达', stops: a.stops.map(s => s.name), tfLevel: tf, tfTime: idealMin, traffic: [], busNames: a.busNames, walk: a.walk };
    paintRoute(coords, a.stops, lineColor, o, d);
  }
  map.flyTo({ center: [(o.lng + d.lng) / 2, (o.lat + d.lat) / 2], zoom: 13 });
};

// 点击方案卡片切换
const selectAlternative = (idx) => { if (idx !== selectedAlt.value) drawRouteAlt(idx); };

const TRAFFIC_META = [
  { label: '畅通', color: '#2ecc71' },
  { label: '缓行', color: '#ffd54f' },
  { label: '拥堵', color: '#ff9800' },
  { label: '严重拥堵', color: '#ef5350' },
];
function buildRouteDetail() {
  if (!routeInfo.value || !routeOD) return null;
  const a = routeAlts.value[selectedAlt.value];
  const info = routeInfo.value;
  let trafficStats = null;
  if (a && a.kind === 'drive' && a.traffic && a.traffic.length) {
    const byStatus = [0,0,0,0]; let total = 0;
    a.traffic.forEach(t => { byStatus[t.status] = (byStatus[t.status]||0) + t.length; total += t.length; });
    trafficStats = byStatus.map((len, i) => ({ status: i, label: TRAFFIC_META[i].label, color: TRAFFIC_META[i].color, length: Math.round(len), pct: total ? Math.round(len/total*100) : 0 })).filter(x => x.length > 0);
    trafficStats.total = Math.round(total);
  }
  const schedules = [];
  if (a && a.kind === 'transit' && a.busNames && a.busNames.length) {
    for (const rawName of a.busNames) {
      const cleanName = String(rawName).replace(/^🚇/, '').trim();
      const sch = lineSchedule({ properties: { name: cleanName } });
      schedules.push({ name: rawName, ...sch });
    }
  }
  return {
    origin: originName.value || '起点', dest: destName.value || '终点', mode: travelMode.value,
    duration: info.duration, distance: info.distance, description: info.description,
    badge: a ? a.badge : '', walk: a && a.walk != null ? a.walk : null,
    tolls: a && a.tolls != null ? a.tolls : null, lights: a && a.lights != null ? a.lights : null,
    kind: a ? a.kind : '', trafficStats, tfLevel: info.tfLevel, tfTime: info.tfTime,
    schedules, stops: info.stops || [], driveSteps: info.driveSteps || []
  };
}
function openRouteDetail() {
  routeDetail.value = buildRouteDetail();
  if (routeDetail.value) routeDetailDialog.value = true;
}

// 驾车/步行：多策略并发（不同策略返回不同路线时即为备选，相同则去重）
const queryDriveOrWalk = (o, d) => {
  const mode = travelMode.value;
  const apiType = mode === '驾车' ? 'driving' : 'walking';
  const [ogcLng, ogcLat] = wgs2gcj(o.lng, o.lat);
  const [dgcLng, dgcLat] = wgs2gcj(d.lng, d.lat);
  routeOD = { o, d };
  const mkUrl = (st) => `/amap/v3/direction/${apiType}?origin=${ogcLng},${ogcLat}&destination=${dgcLng},${dgcLat}&extensions=all${st ? '&strategy=' + st : ''}&key=f752ae50b3478617343635244aa5c843`;
  const strategies = mode === '驾车' ? [[10, '推荐路线'], [35, '躲避拥堵'], [32, '距离优先'], [33, '不走高速']] : [[null, '步行路线']];
  Promise.all(strategies.map(([st, name]) => fetch(mkUrl(st)).then(r => r.json()).then(j => ({ j, name })).catch(() => null)))
    .then(list => {
      const alts = [];
      list.forEach(item => {
        if (!item) return;
        const j = item.j;
        if (j.status === '1' && j.route && j.route.paths && j.route.paths[0]) {
          const path0 = j.route.paths[0];
          const coords = [];
          const steps = [];
          (path0.steps || []).forEach(stp => { if (stp.polyline) coords.push(...polyline2wgs(stp.polyline)); steps.push(stp.instruction || ''); });
          const traffic = (path0.tmcs || []).map(t => ({ length: Number(t.length || 0), status: Number(t.status || 0) }));
          const a = {
            kind: 'drive', name: item.name,
            duration: Math.round(path0.duration / 60), distance: Number(path0.distance),
            tolls: Number(path0.tolls || 0),
            lights: path0.traffic_lights != null && path0.traffic_lights !== '' ? Number(path0.traffic_lights) : null,
            coords, steps, traffic
          };
          const dup = alts.some(x => Math.abs(x.distance - a.distance) < 60 && Math.abs(x.duration - a.duration) <= 1);
          if (!dup) alts.push(a);
        }
      });
      if (!alts.length) { ElMessage.error('未查询到' + mode + '路线'); return; }
      tagAlts(alts);
      routeAlts.value = alts;
      selectedAlt.value = 0;
      drawRouteAlt(0);
      if (alts.length > 1) ElMessage.success('共查询到 ' + alts.length + ' 条' + mode + '方案，可在对话框切换');
      addHistory((originName.value || '起点') + ' → ' + (destName.value || '终点') + '（' + mode + '）', mode === '驾车' ? 'drive' : 'walk');
    })
    .catch(err => {
      console.error(mode + '路线查询失败：', err);
      ElMessage.error(mode + '路线查询失败：' + (err && err.message ? err.message : err));
    });
};

// ============================================================
// ④ 周边设施 POI 检索（高德 place/around）
// ============================================================
const POI_CATEGORIES = [
  { label: '停车场', types: '150900', icon: '🅿️', char: '停', color: '#1e88e5' },
  { label: '加油站', types: '010100', icon: '⛽', char: '油', color: '#ef5350' },
  { label: '公共厕所', types: '200300', icon: '🚻', char: '厕', color: '#00acc1' },
  { label: '医院', types: '090100', icon: '🏥', char: '医', color: '#ec407a' },
  { label: '学校', types: '141200', icon: '🏫', char: '校', color: '#43a047' },
  { label: '商场', types: '060100', icon: '🏬', char: '商', color: '#8e24aa' },
  { label: '公交站', types: '150700', icon: '🚌', char: '公', color: '#fb8c00' },
  { label: '地铁站', types: '150500', icon: '🚇', char: '地', color: '#3949ab' }
];
const makeBadgeSVG = (color, text, textColor) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="15" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
    <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1"/>
    <text x="20" y="26" font-size="17" font-family="Microsoft YaHei,PingFang SC,sans-serif" font-weight="bold" fill="${textColor || '#ffffff'}" text-anchor="middle">${text}</text>
  </svg>`;
let markerImagesReady = false;
function ensureMarkerImages() {
  if (markerImagesReady) return;
  const add = (id, color, text, tc) => { if (!scene.hasImage(id)) scene.addImage(id, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(makeBadgeSVG(color, text, tc))); };
  EVENT_TYPES.forEach(t => add('ev-' + t.value, t.color, t.char, t.value === 'congestion' ? '#4e3500' : '#ffffff'));
  POI_CATEGORIES.forEach(c => add('poi-' + c.types, c.color, c.char));
  markerImagesReady = true;
}
const poiDialogVisible = ref(false);
const poiCategory = ref('150900');
const poiRadius = ref(1000);
const poiCenter = ref(null);
const poiList = ref([]);
let poiLayer = null;

const startPickPoiCenter = () => {
  poiDialogVisible.value = false;
  picking.value = 'poi';
  ElMessage.info('请在地图上点击检索中心');
};

const queryPoi = async () => {
  if (!poiCenter.value) { ElMessage.warning('请先在地图上选择检索中心'); return; }
  const [glng, glat] = wgs2gcj(poiCenter.value.lng, poiCenter.value.lat);
  const url = `/amap/v3/place/around?location=${glng},${glat}&radius=${poiRadius.value}&types=${poiCategory.value}&offset=30&page=1&extensions=all&key=f752ae50b3478617343635244aa5c843`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== '1') { ElMessage.error('检索失败：' + (data.info || '')); return; }
    const pois = data.pois || [];
    const cat = POI_CATEGORIES.find(c => c.types === poiCategory.value) || {};
    poiList.value = pois.filter(p => p.location).map(p => {
      const [lng, lat] = p.location.split(',').map(Number);
      const [wlng, wlat] = gcj2wgs(lng, lat);
      return {
        name: p.name, lng: wlng, lat: wlat,
        address: p.address || ((p.pname || '') + (p.cityname || '') + (p.adname || '')),
        distance: p.distance,
        tel: Array.isArray(p.tel) ? p.tel.join('、') : (p.tel || ''),
        img: 'poi-' + poiCategory.value, catLabel: cat.label || '', color: cat.color || '#00e5ff'
      };
    });
    selectedPoiIndex.value = -1;
    renderPoiLayer();
    if (!poiList.value.length) ElMessage.info('该范围内未找到相关设施，可尝试增大半径');
    else ElMessage.success(`检索到 ${poiList.value.length} 个设施`);
  } catch (err) {
    ElMessage.error('检索失败：' + err.message);
  }
};

function renderPoiLayer() {
  if (poiLayer) { scene.removeLayer(poiLayer); poiLayer = null; }
  if (!poiList.value.length) return;
  ensureMarkerImages();
  const poiFeatures = poiList.value.map(it => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [it.lng, it.lat] },
    properties: { ...it }
  }));
  poiLayer = new PointLayer({ zIndex: 6 })
    .source({ type: 'FeatureCollection', features: poiFeatures })
    .shape('img', v => v)
    .size(26);
  poiLayer.on('mousemove', e => {
    const p = e.feature && e.feature.properties;
    if (!p) return;
    if (hoverPopup) scene.removePopup(hoverPopup);
    hoverPopup = new Popup({ offsets: [0, -12], closeButton: false, closeOnClick: false })
      .setLnglat(e.lngLat)
      .setHTML(`<div style="font-size:12px;line-height:1.7"><b style="color:${p.color || '#00e5ff'}">${p.name}</b><br/>${p.catLabel || ''} · 距中心 ${p.distance} 米</div>`);
    scene.addPopup(hoverPopup);
  });
  poiLayer.on('mouseout', () => {
    if (hoverPopup) { scene.removePopup(hoverPopup); hoverPopup = null; }
  });
  poiLayer.on('click', e => {
    const p = e.feature && e.feature.properties;
    if (!p) return;
    if (popup) scene.removePopup(popup);
    if (hoverPopup) { scene.removePopup(hoverPopup); hoverPopup = null; }
    popup = new Popup({ closeButton: true, closeOnClick: true })
      .setLnglat([p.lng, p.lat])
      .setHTML(`<div style="font-size:13px;line-height:1.8;min-width:160px">
        <b style="color:${p.color || '#00e5ff'};font-size:14px">${p.catLabel ? '[' + p.catLabel + '] ' : ''}${p.name}</b><br/>
        地址：${p.address || '—'}<br/>
        距检索中心：${p.distance} 米
        ${p.tel && p.tel !== '[]' ? '<br/>联系电话：' + p.tel : ''}
      </div>`);
    scene.addPopup(popup);
  });
  // 双击地图上的 POI 标点：规划路线
  poiLayer.on('dblclick', e => {
    const p = e.feature && e.feature.properties;
    if (!p) return;
    planRouteToPoi(p);
  });
  scene.addLayer(poiLayer);
  if (poiCenter.value) map.flyTo({ center: [poiCenter.value.lng, poiCenter.value.lat], zoom: 14 });
}

const selectedPoiIndex = ref(-1);
const flyToPoi = (row) => {
  map.flyTo({ center: [row.lng, row.lat], zoom: 16, pitch: 30 });
};
// 单击结果卡片：选中高亮并飞行定位（与公交方案卡片一致的点选交互）
const selectPoi = (row, i) => {
  selectedPoiIndex.value = i;
  flyToPoi(row);
};

// 双击/点「规划路线」：以该 POI 为终点；起点取已选手动起点，否则默认泉城广场
const planRouteToPoi = (p) => {
  // 关闭周边检索对话框，避免与路线规划对话框双弹窗叠加、互相遮挡
  poiDialogVisible.value = false;
  destPicked.value = { lng: p.lng, lat: p.lat, label: p.name };
  destName.value = p.name;
  if (!originPicked.value) {
    // 未手动选起点时用固定地标「泉城广场」，避免取到飞行后漂移的地图中心而与终点重合
    originName.value = '泉城广场';
    ElMessage.info('以「泉城广场」为起点规划到「' + p.name + '」的驾车路线，可在对话框更换起点或出行方式');
  } else {
    ElMessage.success('已规划到「' + p.name + '」的驾车路线');
  }
  travelMode.value = '驾车'; // 周边前往默认驾车，可在对话框切换步行/公交
  transitVisible.value = true;
  queryTransit();
};

const closePoi = () => {
  if (poiLayer) { scene.removeLayer(poiLayer); poiLayer = null; }
  poiList.value = [];
  selectedPoiIndex.value = -1;
  poiDialogVisible.value = false;
};

// 路况等级 -> 中文文案
const trafficText = (level) => {
  const map = { fast: '畅通', slow: '缓行', congestion: '拥堵' };
  return map[level] || '未知';
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
// 等高线弹窗统一管理（与区县共用 popup 变量，避免多个弹窗叠加）
const closePopup = () => { if (popup) { scene.removePopup(popup); popup = null; } }

// 创建等高线图层（直接使用本地 GIS 数据，不再依赖 8080 json-server）
// —— 事件功能：悬停显示海拔、点击查看等高线详情 ——
const ensureHighlineLayer = () => {
  if (highline) return highline;
  highline = new LineLayer({ zIndex: 1, name: 'jinan-highline' })
    .source(highlineData)
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
  // 悬停等高线：跟随鼠标弹出海拔信息
  highline.on('mousemove', e => {
    const p = e.feature.properties;
    map.getCanvas().style.cursor = 'pointer';
    closePopup();
    popup = new Popup({ offsets: [0, 0], closeButton: false, closeOnClick: true })
      .setLnglat(e.lngLat)
      .setHTML(`<div style="font-size:13px;line-height:1.5">
        <b style="color:#34d399">⛰ 等高线</b><br/>
        海拔 <b>${p.Contour}</b> 米
      </div>`);
    scene.addPopup(popup);
  });
  // 移出等高线：关闭弹窗、恢复光标
  highline.on('mouseout', () => {
    map.getCanvas().style.cursor = '';
    closePopup();
  });
  // 点击等高线：查看等高线详情
  highline.on('click', e => {
    const p = e.feature.properties;
    closePopup();
    popup = new Popup({ offsets: [0, 0], closeButton: true, closeOnClick: true })
      .setLnglat(e.lngLat)
      .setHTML(`<div style="font-size:13px;line-height:1.8">
        <b style="color:#34d399">⛰ 等高线详情</b><br/>
        海拔：<b>${p.Contour}</b> 米<br/>
        类型：${p.Contour % 100 === 0 ? '计曲线（加粗线）' : '首曲线'}<br/>
        编号：${p.Id}
      </div>`);
    scene.addPopup(popup);
  });
  return highline;
}

const addhighline=()=>{
  if(highlineex){
    highlineex=!highlineex
    scene.addLayer(ensureHighlineLayer());
  }else{
    highlineex=!highlineex
    scene.removeLayer(highline)
    closePopup()
  }
}


</script>
<style scoped>
.event-detail-card {
  position: fixed;
  right: 20px;
  top: 120px;
  width: 272px;
  z-index: 9;
  color: #eaf6ff;
  font-size: 13px;
  background: rgba(12, 30, 48, 0.96);
  border: 1px solid rgba(0, 229, 255, 0.4);
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}
.edc-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 12px; font-size: 14px; font-weight: 700;
  background: rgba(0, 229, 255, 0.1); border-bottom: 2px solid #00e5ff;
}
.edc-close { cursor: pointer; color: #9fd8ef; padding: 0 4px; font-size: 14px; }
.edc-close:hover { color: #ff6a6a; }
.edc-body { padding: 10px 12px; line-height: 1.9; }
.edc-row { display: flex; gap: 6px; }
.edc-k { flex: 0 0 60px; color: #8fc4e0; }
.edc-foot { padding: 8px 12px; text-align: right; border-top: 1px solid rgba(255,255,255,.08); }
.edc-del {
  border: none; cursor: pointer; font-size: 12.5px; color: #fff;
  background: linear-gradient(135deg, #ef5350, #c62828);
  border-radius: 10px; padding: 5px 14px;
}
.edc-del:hover { filter: brightness(1.12); }

.county-event-card {
  position: fixed;
  right: 20px;
  bottom: 110px;
  z-index: 6;
}

.county-event-card :deep(.displayCard) {
  position: static !important;
  right: auto !important;
  bottom: auto !important;
}

.marker-clear-btn {
  position: fixed;
  left: 20px;
  bottom: 110px;
  z-index: 8;
  padding: 8px 16px;
  font-size: 13px;
  color: #eafcff;
  cursor: pointer;
  user-select: none;
  background: linear-gradient(135deg, rgba(180, 40, 60, 0.92), rgba(120, 20, 40, 0.92));
  border: 1px solid rgba(255, 120, 140, 0.6);
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(200, 40, 60, 0.35);
  transition: transform 0.15s ease;
}
.marker-clear-btn:hover { transform: translateY(-2px); }

/* 实时公交图例 */
.live-bus-legend {
  position: fixed; left: 20px; top: 118px; z-index: 8;
  min-width: 118px; padding: 9px 12px; color: #eaf6ff; font-size: 12px;
  background: linear-gradient(160deg, rgba(12, 30, 48, .94), rgba(8, 20, 40, .94));
  border: 1px solid rgba(0, 212, 255, .4); border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, .4); backdrop-filter: blur(8px);
}
.live-bus-legend .lbl-title { font-weight: 700; color: #5fe0ff; font-size: 13px; margin-bottom: 6px; }
.live-bus-legend .lbl-row { display: flex; align-items: center; gap: 7px; margin: 3px 0; }
.live-bus-legend .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.live-bus-legend .lbl-tip { margin-top: 6px; color: #8fb0c8; font-size: 11px; line-height: 1.4; border-top: 1px solid rgba(255,255,255,.08); padding-top: 5px; }

/* ===== 顶部公告通知滚动栏 ===== */
.announce-bar {
  position: fixed; top: calc(10vh + 8px); left: 50%; transform: translateX(-50%); z-index: 9;
  width: 38vw; max-width: 500px; display: flex; align-items: center; gap: 8px;
  padding: 4px 14px; border-radius: 16px; cursor: pointer; font-size: 12px;
  background: linear-gradient(90deg, rgba(13, 32, 51, .92), rgba(10, 26, 44, .92));
  border: 1px solid rgba(0, 212, 255, .35); color: #d6e8f7; font-size: 12.5px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, .35); backdrop-filter: blur(8px);
}
.announce-icon { flex: none; }
.announce-scroll { overflow: hidden; white-space: nowrap; }
.announce-text { color: #b9d6ec; transition: color .2s; }
.announce-bar:hover .announce-text { color: #5fe0ff; }
.announce-list { display: flex; flex-direction: column; gap: 10px; }
.announce-item { padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.05); border-left: 3px solid #5fe0ff; }
.announce-item.ann-priority-high { border-left-color: #ff6b6b; }
.announce-item.ann-priority-mid { border-left-color: #ffb35c; }
.announce-item.ann-priority-low { border-left-color: #4ade80; }
.ann-head { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
.ann-type { font-size: 11px; color: #9fd8ff; }
.ann-title { font-weight: 700; color: #e6f0fb; font-size: 13.5px; }
.ann-content { font-size: 12.5px; color: #bcd6ec; line-height: 1.6; }
.ann-time { font-size: 11px; color: #8fb0c8; margin-top: 5px; }

/* ===== 通用空提示 ===== */
.empty-tip { text-align: center; color: #8fb0c8; font-size: 13px; padding: 26px 0; }

/* ===== 实时到站预测结果 ===== */
.arrival-result { margin-top: 10px; }
.arrival-station { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #5fe0ff; margin-bottom: 8px; cursor: pointer; }
.arrival-peak { font-size: 11px; padding: 1px 8px; border-radius: 8px; background: rgba(255, 152, 0, .18); color: #ffb35c; }
.arrival-peak.off { background: rgba(76, 175, 80, .16); color: #7ee2a8; }
.arrival-fly { margin-left: auto; font-size: 12px; color: #9fd8ff; }
.arrival-list { display: flex; flex-direction: column; gap: 8px; }
.arrival-item { display: grid; grid-template-columns: 72px 66px 1fr auto; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 10px; background: rgba(255,255,255,.05); border: 1px solid rgba(120, 180, 220, .14); }
.arrival-line { font-weight: 700; color: #7fe3ff; }
.arrival-eta { display: flex; align-items: baseline; gap: 2px; }
.eta-min { font-size: 22px; font-weight: 800; color: #ffb35c; line-height: 1; }
.eta-min.urgent { color: #ff6b6b; }
.eta-unit { font-size: 11px; color: #9fb3c8; }
.arrival-info { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: #bcd6ec; }
.crowd-空闲 { color: #4ade80; }
.crowd-适中 { color: #ffb35c; }
.crowd-拥挤 { color: #ff6b6b; }
.arrival-interval { color: #8fb0c8; }
.arrival-time { font-size: 11px; color: #8fb0c8; text-align: right; }

/* ===== 班次时刻表 ===== */
.schedule-table { margin-top: 10px; max-height: 340px; overflow: auto; border: 1px solid rgba(120, 180, 220, .18); border-radius: 8px; }
.sch-row { display: grid; grid-template-columns: 60px 1.7fr 54px 54px 46px 46px 1.1fr; gap: 6px; padding: 7px 10px; font-size: 12px; color: #d6e8f7; border-bottom: 1px solid rgba(255,255,255,.06); align-items: center; }
.sch-row:last-child { border-bottom: none; }
.sch-head { background: rgba(0, 212, 255, .1); color: #5fe0ff; font-weight: 700; position: sticky; top: 0; z-index: 1; }
.sch-line { font-weight: 700; color: #7fe3ff; }
.sch-note { color: #8fb0c8; font-size: 11px; }

/* ===== 收藏与历史 ===== */
.fav-list { display: flex; flex-direction: column; gap: 8px; max-height: 340px; overflow: auto; }
.fav-item { display: flex; align-items: center; gap: 9px; padding: 8px 11px; border-radius: 9px; background: rgba(255,255,255,.05); border: 1px solid rgba(120, 180, 220, .13); font-size: 13px; color: #d6e8f7; }
.fav-type { flex: none; font-size: 11px; padding: 2px 8px; border-radius: 8px; background: rgba(0, 212, 255, .14); color: #5fe0ff; }
.fav-type.fav-route { background: rgba(0, 212, 255, .14); color: #5fe0ff; }
.fav-type.fav-stop { background: rgba(255, 152, 0, .16); color: #ffb35c; }
.fav-name { flex: 1; line-height: 1.4; }
.fav-time { font-size: 11px; color: #8fb0c8; }
.fav-del { flex: none; border: none; background: transparent; color: #ff7a7a; cursor: pointer; font-size: 13px; }
.fav-del:hover { color: #ff4d4d; }
.fav-clickable { cursor: pointer; transition: background .15s; }
.fav-clickable:hover { background: rgba(0, 212, 255, .12); border-color: rgba(0, 212, 255, .4); }


/* 实时路况文字摘要条 */
.traffic-summary {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 8;
  padding: 8px 18px;
  font-size: 13px;
  color: #eafcff;
  background: linear-gradient(135deg, rgba(6, 26, 48, 0.92), rgba(10, 60, 100, 0.92));
  border: 1px solid rgba(0, 212, 255, 0.55);
  border-radius: 20px;
  box-shadow: 0 4px 18px rgba(0, 120, 200, 0.35);
  white-space: nowrap;
}

/* 驾车/步行 行驶指引列表 */
.ti-steps {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #d5e2ee;
}
.route-alts { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.route-alt {
  flex: 1; min-width: 118px; padding: 8px 10px; cursor: pointer;
  border: 1.5px solid #d5e2ee; border-radius: 8px; background: #fafcff; transition: all .15s ease;
}
.route-alt:hover { border-color: #ffb066; }
.route-alt.active { border-color: #ff7a00; background: #fff5eb; box-shadow: 0 2px 10px rgba(255,122,0,.18); }
.ra-top { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #333; }
.route-alt.active .ra-name { color: #ff6a00; }
.ra-badge { font-size: 11px; color: #fff; background: #9fb3c8; border-radius: 8px; padding: 0 7px; font-weight: normal; }
.ra-badge.rec { background: linear-gradient(135deg, #ff9800, #fb6a00); }
.ra-meta { font-size: 12px; color: #666; margin-top: 3px; }
.ra-meta b { color: #ff6a00; font-size: 15px; }
.ra-sub { color: #2a7fb8; margin-top: 2px; line-height: 1.45; }

.ti-step-list {
  margin: 6px 0 0;
  padding-left: 20px;
  max-height: 220px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.7;
}
.ti-step-list li { margin-bottom: 4px; }
.ti-step-list :deep(b) { color: #0a7bc4; }

/* 周边 POI 检索结果列表 */
.poi-cards {
  margin-top: 8px;
  max-height: 330px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 2px;
}
.poi-cards-tip { font-size: 12px; color: #0a7bc4; }
.poi-card {
  border: 1.5px solid #dce8f4;
  border-left: 4px solid #00e5ff;
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  background: #fafcff;
  transition: all .15s ease;
}
.poi-card:hover { border-color: #7fc4f0; box-shadow: 0 2px 8px rgba(10,123,196,.12); }
.poi-card.active { border-color: #ff7a00; background: #fff5eb; box-shadow: 0 2px 10px rgba(255,122,0,.18); }
.pc-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pc-name { font-size: 13px; font-weight: 600; color: #0a7bc4; }
.poi-card.active .pc-name { color: #ff6a00; }
.pc-dist { font-size: 12px; color: #ff6a00; font-weight: 600; white-space: nowrap; }
.pc-addr { font-size: 12px; color: #8a97a5; margin-top: 3px; line-height: 1.5; }
.pc-go {
  margin-top: 6px; display: inline-block; font-size: 12px; color: #fff;
  background: linear-gradient(135deg, #ff9800, #fb6a00);
  border-radius: 10px; padding: 2px 10px; cursor: pointer; user-select: none;
}
.pc-go:hover { opacity: .88; }

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

/* 实时路况信息条 */
.ti-traffic {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 6px 10px;
  margin-top: 4px;
  border-radius: 6px;
  border: 1px solid transparent;
}

.ti-traffic-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.ti-traffic-time {
  color: #8a97a5;
  font-size: 12px;
}

/* 畅通 */
.ti-traffic.tf-fast {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

/* 缓行 */
.ti-traffic.tf-slow {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

/* 拥堵 */
.ti-traffic.tf-congestion {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
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

/* 图层控制面板：公交/地铁 线路与站点 分别开关 */
.layer-panel {
  position: fixed;
  right: 18px;
  bottom: calc(8vh + 26px);
  width: 240px;
  z-index: 90;
  background: linear-gradient(160deg, #12263b, #0d1b2a);
  border: 1px solid #2c4a66;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.55);
  color: #e6f0fb;
  padding: 6px 4px 10px;
}

.layer-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px 10px;
  border-bottom: 1px solid #22384e;
  font-size: 14px;
  font-weight: 700;
  color: #4fd1ff;
  letter-spacing: 1px;
}

.layer-close {
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: #9fb3c8;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  transition: background 0.2s;
}

.layer-close:hover {
  background: rgba(255, 90, 90, 0.25);
  color: #fff;
}

.layer-group {
  padding: 10px 12px 4px;
}

.layer-group + .layer-group {
  border-top: 1px dashed #22384e;
  margin-top: 4px;
}

.layer-group-title {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #ffd04b;
}

.layer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 5px 2px;
  cursor: pointer;
  user-select: none;
}

.layer-row + .layer-row {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* ============================================================
   统一主题：深空蓝 + 科技青（后置覆盖层）
   ============================================================ */
/* —— 底部工具栏按钮 —— */
.item-btn {
  width: 46px; height: 46px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, rgba(40, 92, 134, .96), rgba(13, 38, 64, .96)) !important;
  background-color: rgba(20, 60, 96, .9) !important;
  border: 1px solid rgba(99, 205, 255, .45);
  box-shadow: 0 4px 12px rgba(0, 0, 0, .4), inset 0 1px 0 rgba(150, 225, 255, .35) !important;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.item-btn i { font-size: 19px; color: #cdeeff; font-style: normal; }
.item-btn img { filter: drop-shadow(0 0 3px rgba(120, 220, 255, .6)); }
.item-btn:hover {
  transform: translateY(-3px) scale(1.06);
  border-color: #5fe0ff; filter: none;
  box-shadow: 0 0 16px rgba(0, 212, 255, .65), 0 6px 16px rgba(0, 0, 0, .45), inset 0 1px 0 rgba(180, 235, 255, .5) !important;
}
.item-btn:active { transform: translateY(-1px) scale(.97); }
.item p {
  margin: 3px 0 0; padding: 1px 9px; font-size: 12px; color: #d4ecff;
  background: rgba(8, 24, 40, .6); border: 1px solid rgba(99, 205, 255, .18);
  border-radius: 9px; text-shadow: 0 1px 3px #000; white-space: nowrap;
}

/* —— 路线规划表单 / 结果区 —— */
.transit-label { color: #bcd6ec !important; }
.picked-tip { color: #5fd8ff !important; }
.transit-info {
  background: linear-gradient(135deg, rgba(0, 212, 255, .09), rgba(255, 255, 255, .03)) !important;
  border: 1px solid rgba(0, 212, 255, .2) !important;
  color: #d6e8f7 !important; border-radius: 10px !important;
}
.transit-info b { color: #5fd8ff !important; }
.ti-steps, .ti-stops { border-top-color: rgba(255, 255, 255, .12) !important; }
.ti-stops-title { color: #8fb0c8 !important; }
.ti-stops-list { color: #b9d2e6 !important; }
.ti-step-list :deep(b) { color: #5fd8ff !important; }
.ti-stat b { color: #ffd08a !important; }

/* —— 多方案卡片 —— */
.route-alt {
  border: 1.5px solid rgba(120, 180, 220, .22) !important;
  background: rgba(255, 255, 255, .04) !important;
}
.route-alt:hover { border-color: #ffb066 !important; background: rgba(255, 150, 60, .08) !important; }
.route-alt.active {
  border-color: #ff9800 !important;
  background: linear-gradient(135deg, rgba(255, 152, 0, .2), rgba(251, 106, 0, .08)) !important;
  box-shadow: 0 2px 12px rgba(255, 122, 0, .28) !important;
}
.ra-top { color: #e6f0fb !important; }
.ra-meta { color: #a9c4da !important; }
.ra-badge { background: #365574 !important; }
.ra-badge.rec { background: linear-gradient(135deg, #ff9800, #fb6a00) !important; }

/* —— 周边 POI 卡片 —— */
.poi-cards-tip { color: #5fd8ff !important; }
.poi-card {
  border: 1.5px solid rgba(120, 180, 220, .2) !important;
  background: rgba(255, 255, 255, .04) !important;
}
.poi-card:hover { border-color: #4fc3f7 !important; box-shadow: 0 2px 10px rgba(0, 180, 230, .22) !important; }
.poi-card.active {
  border-color: #ff9800 !important;
  background: linear-gradient(135deg, rgba(255, 152, 0, .16), rgba(251, 106, 0, .05)) !important;
  box-shadow: 0 2px 12px rgba(255, 122, 0, .25) !important;
}
.pc-name { color: #5fd8ff !important; }
.poi-card.active .pc-name { color: #ffb066 !important; }
.pc-addr { color: #93b2c9 !important; }

/* —— 悬浮面板统一毛玻璃 —— */
.event-detail-card, .traffic-summary, .marker-clear-btn, .layer-panel {
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.event-detail-card, .layer-panel {
  border-color: rgba(0, 212, 255, .35) !important;
  box-shadow: 0 10px 34px rgba(0, 0, 0, .5), 0 0 0 1px rgba(0, 212, 255, .06) !important;
}

</style>

<style>
/* 线路信息弹窗（人流量/通行时间）深色卡片 */
.mapboxgl-popup.flow-popup .mapboxgl-popup-content {
  background: #0f1b2d;
  color: #fff;
  border: 1px solid #00d4ff;
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

.mapboxgl-popup.flow-popup .mapboxgl-popup-tip {
  border-top-color: #0f1b2d;
  border-bottom-color: #0f1b2d;
}

.mapboxgl-popup.flow-popup .mapboxgl-popup-close-button {
  color: #9fb3c8;
  font-size: 16px;
  padding: 2px 6px;
}

/* ===== 地图业务对话框：Element Plus 深色科技主题 ===== */
.dark-map-dialog {
  background: linear-gradient(160deg, #142a42 0%, #0b1a29 100%) !important;
  border: 1px solid rgba(0, 212, 255, .35);
  border-radius: 14px !important;
  box-shadow: 0 14px 46px rgba(0, 0, 0, .62), inset 0 1px 0 rgba(120, 220, 255, .12);
  overflow: hidden;
}
.dark-map-dialog .el-dialog__header {
  margin-right: 0; padding: 14px 18px;
  background: linear-gradient(90deg, rgba(0, 212, 255, .16), rgba(0, 212, 255, .02));
  border-bottom: 1px solid rgba(0, 212, 255, .22);
}
.dark-map-dialog .el-dialog__title { color: #7fe3ff; font-weight: 700; letter-spacing: 1px; font-size: 15px; }
.dark-map-dialog .el-dialog__headerbtn .el-dialog__close { color: #9fb3c8; font-size: 17px; transition: color .15s; }
.dark-map-dialog .el-dialog__headerbtn:hover .el-dialog__close { color: #ff7a7a; }
.dark-map-dialog .el-dialog__body { color: #d6e8f7; padding: 16px 18px; }
.dark-map-dialog .el-dialog__footer { padding: 12px 18px 16px; border-top: 1px solid rgba(255, 255, 255, .06); }
.dark-map-dialog .el-form-item__label { color: #bcd6ec; }
.dark-map-dialog .el-input__wrapper,
.dark-map-dialog .el-textarea__inner {
  background: rgba(255, 255, 255, .06) !important;
  box-shadow: 0 0 0 1px rgba(120, 180, 220, .25) inset !important;
  border-radius: 8px;
}
.dark-map-dialog .el-input__inner,
.dark-map-dialog .el-textarea__inner { color: #eaf6ff !important; }
.dark-map-dialog .el-input__inner::placeholder,
.dark-map-dialog .el-textarea__inner::placeholder { color: #6f8aa3; }
.dark-map-dialog .el-input__wrapper:hover,
.dark-map-dialog .el-input.is-focus .el-input__wrapper,
.dark-map-dialog .el-textarea__inner:focus { box-shadow: 0 0 0 1px #00d4ff inset !important; }
.dark-map-dialog .el-radio { color: #cfe4f5; }
.dark-map-dialog .el-radio__label { color: #cfe4f5; }
.dark-map-dialog .el-slider__runway { background: rgba(255, 255, 255, .14); }
.dark-map-dialog .el-slider__bar { background: linear-gradient(90deg, #00d4ff, #33e0ff); }
.dark-map-dialog .el-slider__button { border-color: #00d4ff; }
.dark-map-dialog .el-button { border-radius: 9px; font-weight: 600; }
.dark-map-dialog .el-button--default {
  background: rgba(255, 255, 255, .06); color: #cfe4f5;
  border: 1px solid rgba(150, 190, 220, .3);
}
.dark-map-dialog .el-button--default:hover {
  background: rgba(0, 212, 255, .14); border-color: #00d4ff; color: #fff;
}
.dark-map-dialog .el-button--primary {
  background: linear-gradient(135deg, #12b8e6, #0a86d8); border: none;
  box-shadow: 0 4px 14px rgba(0, 150, 220, .35);
}
.dark-map-dialog .el-button--primary:hover { filter: brightness(1.12); }
.dark-map-dialog .el-button--danger {
  background: linear-gradient(135deg, #ef5350, #c62828); border: none;
}
/* 下拉浮层（teleport 到 body） */
.el-select__popper.el-popper {
  background: #0f2236 !important; border: 1px solid rgba(0, 212, 255, .3) !important;
}
.el-select__popper .el-select-dropdown__item { color: #cfe4f5; }
.el-select__popper .el-select-dropdown__item.hover,
.el-select__popper .el-select-dropdown__item:hover { background: rgba(0, 212, 255, .14); color: #fff; }
.el-select__popper .el-select-dropdown__item.selected { color: #5fe0ff; }
.el-select__popper .el-popper__arrow::before { background: #0f2236 !important; border-color: rgba(0, 212, 255, .3) !important; }
/* 细滚动条 */
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-thumb { background: rgba(120, 170, 210, .35); border-radius: 8px; }
*::-webkit-scrollbar-thumb:hover { background: rgba(0, 212, 255, .5); }
*::-webkit-scrollbar-track { background: transparent; }
/* 单选 / 开关选中态统一为科技青 */
.dark-map-dialog .el-radio__input.is-checked .el-radio__inner {
  border-color: #00d4ff; background: #00d4ff;
}
.dark-map-dialog .el-radio__input.is-checked + .el-radio__label { color: #5fe0ff; }
.dark-map-dialog .el-radio:hover .el-radio__inner { border-color: #5fe0ff; }
.layer-panel .el-switch.is-checked .el-switch__core {
  border-color: #00d4ff !important; background-color: #00d4ff !important;
}

/* ===== 路线详情弹窗 ===== */
.route-detail { color: #d6e4f0; }
.rd-section { margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid rgba(0,212,255,0.12); }
.rd-section:last-child { border-bottom: none; margin-bottom: 0; }
.rd-title { font-size: 15px; font-weight: 600; color: #5fe0ff; margin-bottom: 8px; }
.rd-od { font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 6px; }
.rd-meta { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; color: #a8c0d4; margin: 4px 0; }
.rd-meta b { color: #fff; }
.rd-badge { background: linear-gradient(90deg,#ff9800,#fb6a00); color: #fff; padding: 1px 8px; border-radius: 10px; font-size: 12px; }
.rd-desc { font-size: 13px; color: #c0d4e4; margin-top: 4px; }
.rd-traffic-total { font-size: 13px; color: #a8c0d4; margin-bottom: 8px; }
.rd-traffic-list { display: flex; flex-direction: column; gap: 6px; }
.rd-traffic-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.rd-traffic-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.rd-traffic-label { width: 60px; color: #d6e4f0; }
.rd-traffic-len { width: 60px; color: #a8c0d4; }
.rd-traffic-bar { flex: 1; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
.rd-traffic-fill { height: 100%; border-radius: 4px; }
.rd-traffic-pct { width: 40px; text-align: right; color: #a8c0d4; }
.rd-traffic-simple { padding: 8px 12px; border-radius: 6px; font-size: 13px; }
.rd-traffic-simple.tf-fast { background: rgba(46,204,113,0.15); color: #2ecc71; }
.rd-traffic-simple.tf-slow { background: rgba(255,167,38,0.15); color: #ffa726; }
.rd-traffic-simple.tf-congestion { background: rgba(239,83,80,0.15); color: #ef5350; }
.rd-sch-table { display: flex; flex-direction: column; gap: 4px; }
.rd-sch-head, .rd-sch-row { display: grid; grid-template-columns: 1.6fr 0.7fr 0.7fr 0.6fr 0.6fr; gap: 6px; font-size: 13px; padding: 5px 8px; }
.rd-sch-head { color: #5fe0ff; font-weight: 600; border-bottom: 1px solid rgba(0,212,255,0.2); }
.rd-sch-row { color: #c0d4e4; background: rgba(255,255,255,0.03); border-radius: 4px; }
.rd-sch-name { color: #fff; font-weight: 500; }
.rd-sch-note { font-size: 11px; color: #6b8299; margin-top: 8px; }

</style>
  