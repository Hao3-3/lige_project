<template>
    <header class="header">
          泉城智慧出行
          <button class="theme-toggle" :title="'点击切换到' + (isCold ? '暖色' : '冷色')" @click="toggleTheme">
            {{ isCold ? '冷色' : '暖色' }}
          </button>
          <div class="timer" :style="timerStyle" @mousedown="onTimerMouseDown">
                <p class="date">{{ dateStr }}</p>
                <p class="time">{{ timeStr }}</p>
          </div>
    </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const now = ref(new Date())
let timer

onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

const dateStr = computed(() => {
  const d = now.value
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

const timeStr = computed(() => {
  const d = now.value
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${mi}:${s}`
})

// 暖色/冷色主题切换
const isCold = ref(false)
const toggleTheme = () => {
  isCold.value = !isCold.value
  document.body.classList.toggle('cold', isCold.value)
}

// 时间拖动
const timerStyle = ref(null);
let timerDragState = null;

const onTimerMouseDown = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  timerDragState = { startX: e.clientX, startY: e.clientY, left: rect.left, top: rect.top };
  document.addEventListener('mousemove', onTimerMouseMove);
  document.addEventListener('mouseup', onTimerMouseUp);
  e.preventDefault();
};

const onTimerMouseMove = (e) => {
  if (!timerDragState) return;
  const dx = e.clientX - timerDragState.startX;
  const dy = e.clientY - timerDragState.startY;
  timerStyle.value = {
    left: (timerDragState.left + dx) + 'px',
    top: (timerDragState.top + dy) + 'px',
    right: 'auto',
    bottom: 'auto',
  };
};

const onTimerMouseUp = () => {
  timerDragState = null;
  document.removeEventListener('mousemove', onTimerMouseMove);
  document.removeEventListener('mouseup', onTimerMouseUp);
};
</script>

<style>
.header {
    position: fixed;
    z-index: 10;
    top: 0;
    left: 0;
    width: 100%;
    height: 10vh;
    background-image: url("../assets/header.png");
    background-size: cover;
    background-position: center center;
    text-align: center;
    line-height: 82px;
    font-size: 30px;
    color: #fff;
    font-family: clockicons, sans-serif, Georgia, Times, 'Times New Roman', serif;
    z-index: 3 !important;
}

.theme-toggle {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    padding: 5px 14px;
    background: var(--control-bg);
    color: #fff;
    border: 1px solid var(--accent);
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    line-height: 1.4;
}

.timer {
    position: fixed;
    right: 20px;
    bottom: 100px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    padding: 12px 18px;
    background: rgba(15, 15, 20, 0.45);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--accent);
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
    color: #fff;
}

.timer .date {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.72);
    letter-spacing: 1px;
    margin: 0;
}

.timer .time {
    font-size: 26px;
    font-weight: 700;
    font-family: 'Courier New', Consolas, monospace;
    color: var(--accent);
    letter-spacing: 1px;
    line-height: 1.2;
    margin: 0;
}
</style>
