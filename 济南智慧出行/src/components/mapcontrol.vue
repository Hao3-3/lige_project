<template>
    <!-- 底图切换控件（折叠缩略图） -->
    <div class="theme-switch">
        <!-- 折叠状态：单张缩略图 -->
        <div v-if="!themeOpen" class="theme-collapsed" title="切换底图样式" @click="themeOpen = true">
            <img :src="currentTheme.img" :alt="currentTheme.text" />
            <span class="badge">底图</span>
        </div>
        <!-- 展开状态：可选样式面板 -->
        <div v-else class="theme-panel">
            <div class="theme-panel-head">
                <span>底图样式</span>
                <button class="theme-close" @click="themeOpen = false">✕</button>
            </div>
            <div
                v-for="t in themes"
                :key="t.value"
                class="theme-item"
                :class="{ active: activeStyle === t.value }"
                @click="switchTheme(t)"
            >
                <img :src="t.img" :alt="t.text" />
                <span>{{ t.text }}</span>
            </div>
        </div>
    </div>

    <!-- 导航功能开关（可拖动） -->
    <div class="nav-toggle" :class="{ on: navOpen }" :style="navStyle" @mousedown="onNavMouseDown" @click="onClickNav">
        {{ navOpen ? '关闭导航' : '导航' }}
    </div>
</template>

<script setup>
import { inject, ref, computed } from "vue";
const { scene, map } = inject("$scene_map");
import { Fullscreen, MouseLocation } from "@antv/l7";

const themes = [
    { text: "导航夜间", value: "mapbox://styles/mapbox/navigation-night-v1", img: "/src/assets/themes/navigation-night-v1.png" },
    { text: "导航日间", value: "mapbox://styles/mapbox/navigation-day-v1", img: "/src/assets/themes/navigation-day-v1.png" },
    { text: "卫星街道", value: "mapbox://styles/mapbox/satellite-streets-v12", img: "/src/assets/themes/satellite-streets-v12.png" },
    { text: "卫星影像", value: "mapbox://styles/mapbox/satellite-v9", img: "/src/assets/themes/satellite-v9.png" },
];
const activeStyle = ref(themes[0].value);
const themeOpen = ref(false);
const currentTheme = computed(() => themes.find((t) => t.value === activeStyle.value) || themes[0]);

const switchTheme = (t) => {
    activeStyle.value = t.value;
    map.setStyle(t.value);
    themeOpen.value = false; // 选中后收起
};

// 导航（Mapbox Directions）
let directions = null;
const navOpen = ref(false);
const toggleNav = () => {
    if (!directions) {
        directions = new window.MapboxDirections({
            accessToken: import.meta.env.VITE_TOKEN,
            unit: 'metric',
            profile: 'mapbox/driving',
            controls: { inputs: true, instructions: true, profileSwitcher: true },
        });
        map.addControl(directions, 'top-left');
        navOpen.value = true;
    } else {
        if (navOpen.value) {
            map.removeControl(directions);
            navOpen.value = false;
        } else {
            map.addControl(directions, 'top-left');
            navOpen.value = true;
        }
    }
};

// 导航按钮拖动
const navStyle = ref(null);
let dragState = null;
let dragMoved = false;

const onNavMouseDown = (e) => {
  dragMoved = false;
  const rect = e.currentTarget.getBoundingClientRect();
  dragState = { startX: e.clientX, startY: e.clientY, left: rect.left, top: rect.top };
  document.addEventListener('mousemove', onNavMouseMove);
  document.addEventListener('mouseup', onNavMouseUp);
  e.preventDefault();
};

const onNavMouseMove = (e) => {
  if (!dragState) return;
  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
  if (dragMoved) {
    navStyle.value = {
      left: (dragState.left + dx) + 'px',
      top: (dragState.top + dy) + 'px',
      bottom: 'auto',
    };
  }
};

const onNavMouseUp = () => {
  dragState = null;
  document.removeEventListener('mousemove', onNavMouseMove);
  document.removeEventListener('mouseup', onNavMouseUp);
};

const onClickNav = () => {
  if (dragMoved) { dragMoved = false; return; }
  toggleNav();
};

// 在地图加载完成后加载 L7 控件
scene.on("load", () => {
    const fullScreen = new Fullscreen({
        btnText: "全屏",
        exitBtnText: "退出全屏",
        position: 'righttop'
    });
    scene.addControl(fullScreen);

    const mouseLocation = new MouseLocation({
        transform: (position) => position.map((item) => item.toFixed(4)),
    });
    scene.addControl(mouseLocation);
});
</script>

<style scoped>
.theme-switch {
    position: fixed;
    top: 100px;
    right: 16px;
    z-index: 100;
}

.theme-collapsed {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid var(--accent);
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
}

.theme-collapsed img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.theme-collapsed .badge {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    padding: 2px 0;
    text-align: center;
    font-size: 11px;
    color: #fff;
    background: rgba(0, 0, 0, 0.6);
    letter-spacing: 1px;
}

.theme-panel {
    width: 118px;
    padding: 8px;
    background: var(--control-bg-solid);
    border: 1px solid var(--accent);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.theme-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    padding: 0 2px;
}

.theme-close {
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 2px;
}

.theme-item {
    width: 100%;
    padding: 5px;
    background: rgba(0, 0, 0, 0.2);
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    color: #fff;
    font-size: 12px;
    transition: border-color 0.2s;
}

.theme-item.active {
    border-color: var(--accent);
}

.theme-item img {
    width: 100%;
    height: 52px;
    object-fit: cover;
    border-radius: 4px;
    display: block;
    margin-bottom: 4px;
}

.nav-toggle {
    position: fixed;
    left: 16px;
    top: 100px;
    z-index: 100;
    padding: 8px 14px;
    background: var(--control-bg);
    color: #fff;
    border: 1px solid var(--accent);
    border-radius: 6px;
    cursor: grab;
    font-size: 14px;
    user-select: none;
}

.nav-toggle:active {
    cursor: grabbing;
}

.nav-toggle.on {
    background: var(--accent);
    color: var(--accent-contrast);
}
</style>

<style>
.l7-control-mouse-location {
    transform: translateY(-30px);
    background-color: rgba(0, 0, 0, 0);
    color: #fff !important;
    font-size: 18px !important;
}

.l7-control-logo {
    margin-bottom: 20px !important;
}
</style>
