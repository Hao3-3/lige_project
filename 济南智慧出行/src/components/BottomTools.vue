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
    <div class="main-cat" :class="{ active: activeMenu==='traffic' }" @click="toggleMenu('traffic')">
      <i :class="['iconfont', 'icon-kongzhi']"></i>
      <p>交通出行</p>
    </div>
    <div class="main-cat" :class="{ active: activeMenu==='tools' }" @click="toggleMenu('tools')">
      <i :class="['iconfont', 'icon-icon-test']"></i>
      <p>地图工具</p>
    </div>
    <div class="main-cat" :class="{ active: activeMenu==='view' }" @click="toggleMenu('view')">
      <i :class="['iconfont', 'icon-supervision-full']"></i>
      <p>视图控制</p>
    </div>
  </div>

  <!-- 分类子菜单浮层 -->
  <div v-show="activeMenu" class="submenu" @mousedown.stop>
    <div class="submenu-head">
      <span>{{ menuTitle }}</span>
      <button class="submenu-close" @click="activeMenu=''">✕</button>
    </div>
    <div class="submenu-grid">
      <div class="submenu-item" v-for="item in currentMenuItems" :key="item.label" @click="runMenuItem(item)">
        <i :class="['iconfont', item.icon]"></i>
        <p>{{ item.label }}</p>
      </div>
    </div>
  </div>

    <!-- 公告通知跑马灯滚动栏 -->
  <div v-if="allAnnouncements.length" class="announce-bar" @click="announceDialog = true">
    <span class="announce-icon">📢</span>
    <div class="announce-scroll">
      <div class="announce-track">
        <span v-for="(a, i) in allAnnouncements" :key="i" class="announce-item-text">
          <b class="ann-tag" :class="'ann-' + a.type">[{{ annTypeLabel(a.type) }}]</b> {{ a.title }}：{{ a.content }}
        </span>
        <span v-for="(a, i) in allAnnouncements" :key="'dup' + i" class="announce-item-text">
          <b class="ann-tag" :class="'ann-' + a.type">[{{ annTypeLabel(a.type) }}]</b> {{ a.title }}：{{ a.content }}
        </span>
      </div>
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
      <el-button v-if="routeInfo && travelMode==='驾车'" type="success" @click="startLaneNavi">🧭 开始导航</el-button>
      <el-button type="primary" @click="queryTransit">查询路线</el-button>
    </template>
  </el-dialog>


  <!-- 车道级导航浮层 -->
  <div v-if="laneNavi.active" class="lane-navi-overlay">
    <div class="ln-main">
      <div class="ln-arrow-box">
        <svg viewBox="0 0 64 64" class="ln-arrow-svg">
          <path v-if="laneNavi.arrow==='left'" d="M40 14 L18 32 L40 50 L40 38 L30 32 L40 26 Z" fill="#fff"/>
          <path v-else-if="laneNavi.arrow==='right'" d="M24 14 L46 32 L24 50 L24 38 L34 32 L24 26 Z" fill="#fff"/>
          <path v-else-if="laneNavi.arrow==='uturn'" d="M20 46 L20 26 Q20 14 32 14 Q44 14 44 26 L44 32 M44 20 L50 26 L44 32" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
          <path v-else d="M32 12 L44 36 L36 36 L36 52 L28 52 L28 36 L20 36 Z" fill="#fff"/>
        </svg>
      </div>
      <div class="ln-info">
        <div class="ln-dist">{{ laneNavi.distance }}</div>
        <div class="ln-road">{{ laneNavi.road }}</div>
      </div>
      <button class="ln-exit" @click="exitLaneNavi">✕ 退出</button>
    </div>
    <div class="ln-bottom">
      <div class="ln-eta">⏱ 剩余 <b>{{ laneNavi.remainMin }}</b> 分钟</div>
      <div class="ln-lanes">
        <div class="ln-lane" v-for="(lane,i) in laneNavi.lanes" :key="i" :class="{rec: lane.rec}">
          <svg viewBox="0 0 40 30" class="ln-lane-svg">
            <path v-if="lane.left" d="M18 8 L6 15 L18 22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path v-if="lane.straight" d="M20 6 L20 24" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path v-if="lane.right" d="M22 8 L34 15 L22 22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          </svg>
          <div v-if="lane.rec" class="ln-rec-badge">推荐</div>
        </div>
      </div>
    </div>
  </div>

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
import { ref, computed, onMounted } from 'vue'
import DisplayCard from './DisplayCard.vue'
import { useShared } from '../composables/useShared'
import { useMapBase } from '../composables/useMapBase'
import { useBus } from '../composables/useBus'
import { useMetro } from '../composables/useMetro'
import { useTransit } from '../composables/useTransit'

const emit = defineEmits(['controlCenter'])

// ============ 公共基础（单例 + 工具 + 公告 + 收藏/历史） ============
const shared = useShared()
const {
  map,
  formatTime, annTypeLabel, announcements, allAnnouncements,
  announceDialog, favDialog, favTab, favList, historyList,
  removeFavorite, clearHistory, openFavDialog,
} = shared

// ============ 地图基础与公共交互（邵智昊） ============
const mapBase = useMapBase(shared, { emit })
const {
  isRotate, rotate, toggleRotate,
  footerBottom, onFooterMouseDown,
  g2Visible, controlCenter,
  flyJinan, trigger,
  layerPanelVisible,
  countyEvents, countyEventsVisible, clearCountyEvents, addll,
  addhighline, addweather,
} = mapBase

// ============ 公交系统（郭津铭） ============
const bus = useBus(shared)
const {
  busShowLines, busShowStops, busShowVehicles, busStopPredict, syncBusLayer,
  addbus, liveBusRunning,
  busArrivalDialog, busArrivalStation, busArrivalLoading, busArrivalData,
  queryBusArrival, flyToArrivalStation,
  scheduleDialog, scheduleLine, scheduleLoading, scheduleList, querySchedules,
} = bus

// ============ 地铁系统（比拉力） ============
const metro = useMetro(shared)
const {
  metroShowLines, metroShowStops, syncMetroLayer,
  addmetro,
} = metro

// ============ 出行导航与工具（艾合太木江） ============
const transit = useTransit(shared)
const {
  trafficSummary, toggleTraffic,
  transitVisible, originName, landmarks, startPick, originPicked, destName, destPicked, travelMode,
  routeInfo, routeAlts, selectedAlt, selectAlternative, routeBounds, overviewRoute,
  routeDetailDialog, routeDetail, trafficText, favCurrentRoute,
  laneNavi, startLaneNavi, exitLaneNavi,
  reportDialogVisible, reportForm, EVENT_TYPES, startReport, submitReport,
  reportedEvents, clearReportedEvents, eventDetail, removeCurrentEvent,
  poiDialogVisible, poiCenter, startPickPoiCenter, poiCategory, POI_CATEGORIES, poiRadius,
  queryPoi, poiList, selectedPoiIndex, selectPoi, planRouteToPoi, closePoi,
  applyFavorite, replayByName,
} = transit

// ============ 底部菜单 ============
const activeMenu = ref('')
const menuGroups = {
  traffic: [
    { icon: 'icon-kongzhi', label: '公交系统', action: () => addbus() },
    { icon: 'icon-supervision-full', label: '地铁系统', action: () => addmetro() },
    { icon: 'icon-icon-test', label: '公交路线', action: () => { transitVisible.value = true } },
    { icon: 'icon-kongzhi', label: '实时路况', action: () => toggleTraffic() },
    { icon: 'icon-icon-test', label: '到站预测', action: () => { busArrivalDialog.value = true } },
    { icon: 'icon-supervision-full', label: '班次查询', action: () => { scheduleDialog.value = true } },
  ],
  tools: [
    { icon: 'icon-icon-test', label: '周边检索', action: () => { poiDialogVisible.value = true } },
    { icon: 'icon-supervision-full', label: '事件上报', action: () => startReport() },
    { icon: 'icon-paint', label: '范围查询', action: () => trigger() },
    { icon: 'icon-ruler', label: '县区规划', action: () => addll() },
    { icon: 'icon-supervision-full', label: '图层控制', action: () => { layerPanelVisible.value = !layerPanelVisible.value } },
    { icon: 'icon-drawCircleTool', label: '济南等高', action: () => addhighline() },
    { icon: 'icon-icon-test', label: '查看天气', action: () => addweather() },
  ],
  view: [
    { icon: 'icon-kongzhi', label: '我的收藏', action: () => openFavDialog() },
    { icon: 'icon-icon-test', label: '飞行济南', action: () => flyJinan() },
    { icon: 'icon-supervision-full', label: '控制中心', action: () => controlCenter() },
    { icon: 'icon-fuwudiqiu', label: '自动旋转', action: () => toggleRotate() },
  ]
}
const menuTitles = { traffic: '交通出行', tools: '地图工具', view: '视图控制' }
const currentMenuItems = computed(() => menuGroups[activeMenu.value] || [])
const menuTitle = computed(() => menuTitles[activeMenu.value] || '')
function toggleMenu(key) { activeMenu.value = activeMenu.value === key ? '' : key }
function runMenuItem(item) { item.action(); activeMenu.value = '' }

// ============ 挂载：开始自转 + 移动结束刷新路况 + 加载已上报事件 ============
onMounted(() => {
  rotate()
  map.on('moveend', () => {
    isRotate.value && rotate()
    transit.trafficOn.value && transit.fetchTraffic()
  })
  transit.loadReportedEvents()
})
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
.announce-scroll { overflow: hidden; flex: 1; white-space: nowrap; mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent); }
.announce-track {
  display: inline-flex; white-space: nowrap; align-items: center;
  animation: announce-marquee 40s linear infinite;
}
.announce-track:hover { animation-play-state: paused; }
.announce-item-text { color: #b9d6ec; margin-right: 50px; font-size: 12.5px; }
.ann-tag { font-size: 11px; padding: 0 6px; border-radius: 6px; margin-right: 4px; }
.ann-alert { background: rgba(255, 80, 80, .2); color: #ff8a8a; }
.ann-adjustment { background: rgba(255, 179, 92, .2); color: #ffc98a; }
.ann-other { background: rgba(95, 224, 255, .15); color: #8fe8ff; }
.ann-traffic { background: rgba(255, 152, 0, .2); color: #ffcc80; }
.ann-event { background: rgba(255, 82, 82, .25); color: #ff8a8a; }
.announce-bar:hover .announce-item-text { color: #5fe0ff; }
@keyframes announce-marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
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
  margin-right: 8px;
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
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, rgba(40, 92, 134, .96), rgba(13, 38, 64, .96)) !important;
  background-color: rgba(20, 60, 96, .9) !important;
  border: 1px solid rgba(99, 205, 255, .45);
  box-shadow: 0 3px 9px rgba(0, 0, 0, .4), inset 0 1px 0 rgba(150, 225, 255, .35) !important;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.item-btn i { font-size: 15px; color: #cdeeff; font-style: normal; }
.item-btn img { filter: drop-shadow(0 0 3px rgba(120, 220, 255, .6)); }
.item-btn:hover {
  transform: translateY(-2px) scale(1.08);
  border-color: #5fe0ff; filter: none;
  box-shadow: 0 0 12px rgba(0, 212, 255, .6), 0 4px 12px rgba(0, 0, 0, .45), inset 0 1px 0 rgba(180, 235, 255, .5) !important;
}
.item-btn:active { transform: translateY(-1px) scale(.96); }
.item p {
  margin: 2px 0 0; padding: 0 7px; font-size: 11px; color: #d4ecff;
  background: rgba(8, 24, 40, .6); border: 1px solid rgba(99, 205, 255, .18);
  border-radius: 8px; text-shadow: 0 1px 3px #000; white-space: nowrap;
}
.main-cat {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #cdeeff; cursor: pointer; margin: 0 18px; margin-bottom: -18px;
  transform: rotate(180deg);
}
.main-cat i { font-size: 18px; font-style: normal; }
.main-cat p {
  margin: 3px 0 0; font-size: 12px; color: #d4ecff;
  background: rgba(8, 24, 40, .6); border: 1px solid rgba(99, 205, 255, .18);
  border-radius: 9px; padding: 1px 10px; white-space: nowrap;
}
.main-cat:hover i, .main-cat.active i { color: #5fe0ff; }
.main-cat.active p { border-color: #5fe0ff; color: #5fe0ff; }
.submenu {
  position: fixed; bottom: 8vh; left: 50%; transform: translateX(-50%);
  z-index: 4; min-width: 360px;
  background: linear-gradient(160deg, rgba(12, 30, 48, .96), rgba(8, 20, 40, .96));
  border: 1px solid rgba(0, 212, 255, .4); border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, .5); backdrop-filter: blur(10px);
  padding: 10px 14px;
}
.submenu-head {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; font-weight: 700; color: #5fe0ff; margin-bottom: 10px;
  padding-bottom: 6px; border-bottom: 1px solid rgba(0, 212, 255, .2);
}
.submenu-close {
  background: none; border: none; color: #9fd8ef; font-size: 14px;
  cursor: pointer; padding: 0 4px;
}
.submenu-close:hover { color: #ff6a6a; }
.submenu-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.submenu-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 4px; border-radius: 8px; cursor: pointer;
  border: 1px solid rgba(99, 205, 255, .15); transition: all .15s ease;
}
.submenu-item:hover {
  background: rgba(0, 212, 255, .12); border-color: #5fe0ff;
}
.submenu-item i { font-size: 16px; color: #cdeeff; font-style: normal; }
.submenu-item:hover i { color: #5fe0ff; }
.submenu-item p { font-size: 11px; color: #d4ecff; margin: 0; white-space: nowrap; }
.group-divider {
  width: 1px; height: 42px; margin: 0 8px; flex: none;
  background: linear-gradient(to bottom, transparent, rgba(99, 205, 255, .5), transparent);
  transform: rotate(180deg);
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


/* ===== 车道级导航浮层 ===== */
.lane-navi-overlay {
  position: fixed;
  top: 11vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: 300;
  background: linear-gradient(145deg, rgba(8,25,50,.94), rgba(5,15,35,.96));
  border: 1px solid rgba(0,212,255,.35);
  border-radius: 18px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,.5), 0 0 24px rgba(0,212,255,.15);
  backdrop-filter: blur(14px);
  color: #fff;
  min-width: 420px;
}
.ln-main {
  display: flex;
  align-items: center;
  gap: 18px;
}
.ln-arrow-box {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #00bcd4, #0091ea);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(0,188,212,.5);
  flex-shrink: 0;
}
.ln-arrow-svg { width: 44px; height: 44px; }
.ln-info { flex: 1; min-width: 0; }
.ln-dist {
  font-size: 30px;
  font-weight: 800;
  color: #5fe0ff;
  text-shadow: 0 0 12px rgba(0,212,255,.5);
  line-height: 1.1;
}
.ln-road {
  font-size: 14px;
  color: rgba(200,230,255,.85);
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ln-exit {
  padding: 7px 16px;
  background: rgba(255,80,80,.15);
  border: 1px solid rgba(255,100,100,.4);
  color: #ff9e9e;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  transition: all .15s;
}
.ln-exit:hover { background: rgba(255,80,80,.35); }
.ln-bottom {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,.08);
}
.ln-eta {
  font-size: 13px;
  color: rgba(180,220,255,.75);
  white-space: nowrap;
}
.ln-eta b { color: #5fe0ff; font-size: 16px; }
.ln-lanes {
  display: flex;
  gap: 6px;
  flex: 1;
  justify-content: flex-end;
}
.ln-lane {
  position: relative;
  width: 46px;
  height: 34px;
  background: rgba(255,255,255,.06);
  border: 1.5px solid rgba(255,255,255,.25);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,.8);
}
.ln-lane-svg { width: 30px; height: 22px; }
.ln-lane.rec {
  background: rgba(0,212,255,.25);
  border-color: #5fe0ff;
  box-shadow: 0 0 12px rgba(0,212,255,.4);
  color: #5fe0ff;
}
.ln-rec-badge {
  position: absolute;
  top: -8px;
  right: -6px;
  background: #5fe0ff;
  color: #002;
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 700;
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
