<template>
    <!-- 底图切换控件 -->
    <div class="theme-switch">
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

    <!-- 导航功能开关（可拖动） -->
    <div class="nav-toggle" :class="{ on: navOpen }" :style="navStyle" @mousedown="onNavMouseDown" @click="onClickNav">
        {{ navOpen ? '关闭导航' : '导航' }}
    </div>
</template>

<script setup>
import { inject, ref } from "vue";
const { scene, map } = inject("$scene_map");
import { Fullscreen, MouseLocation } from "@antv/l7";

const themes = [
    { text: "导航夜间", value: "mapbox://styles/mapbox/navigation-night-v1", img: "/src/assets/themes/navigation-night-v1.png" },
    { text: "导航日间", value: "mapbox://styles/mapbox/navigation-day-v1", img: "/src/assets/themes/navigation-day-v1.png" },
    { text: "卫星街道", value: "mapbox://styles/mapbox/satellite-streets-v12", img: "/src/assets/themes/satellite-streets-v12.png" },
    { text: "卫星影像", value: "mapbox://styles/mapbox/satellite-v9", img: "/src/assets/themes/satellite-v9.png" },
];
const activeStyle = ref(themes[0].value);

const switchTheme = (t) => {
    activeStyle.value = t.value;
    map.setStyle(t.value);
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
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.theme-item {
    width: 110px;
    padding: 6px;
    background: var(--control-bg-solid);
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
    height: 60px;
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
