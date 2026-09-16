<template>
    <header class="header">
          泉城智慧出行
          <div class="header-right">
            <span class="username" v-if="username">{{ username }}</span>
            <button class="theme-toggle" :title="'点击切换到' + (isCold ? '暖色' : '冷色')" @click="toggleTheme">
              {{ isCold ? '冷色' : '暖色' }}
            </button>
            <button class="logout" @click="logout">退出</button>
          </div>
          <div class="timer" :style="timerStyle" @mousedown="onTimerMouseDown">
                <p class="date">{{ dateStr }}</p>
                <p class="time">{{ timeStr }}</p>
          </div>
    </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref(localStorage.getItem('username') || '')
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  router.replace('/login')
}

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

const isCold = ref(true)
const toggleTheme = () => {
  isCold.value = !isCold.value
  document.body.classList.toggle('warm', !isCold.value)
}

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

.header-right {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
}

.username {
    color: #fff;
    font-size: 14px;
    line-height: 1;
    letter-spacing: 1px;
}

.theme-toggle,
.logout {
    padding: 5px 14px;
    background: var(--control-bg);
    color: #fff;
    border: 1px solid var(--accent);
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    line-height: 1.4;
}

.logout:hover {
    background: rgba(255, 80, 80, 0.25);
    border-color: rgba(255, 120, 120, 0.7);
}

.timer {
    position: fixed;
    right: 20px;
    bottom: 100px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 16px 22px;
    background: linear-gradient(145deg, rgba(10, 25, 50, 0.35), rgba(5, 15, 35, 0.45));
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(0, 212, 255, 0.45);
    border-radius: 16px;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.2), inset 0 1px 0 rgba(120, 200, 255, 0.2);
    color: #fff;
    min-width: 130px;
    text-align: center;
}

.timer .date {
    font-size: 12px;
    color: rgba(160, 220, 255, 0.85);
    letter-spacing: 2px;
    margin: 0;
}

.timer .time {
    font-size: 30px;
    font-weight: 700;
    font-family: 'Courier New', Consolas, monospace;
    color: #5fe0ff;
    letter-spacing: 2px;
    line-height: 1.1;
    margin: 0;
    text-shadow: 0 0 12px rgba(0, 212, 255, 0.6);
}
</style>
