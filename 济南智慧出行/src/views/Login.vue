<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="brand">
        <div class="brand-title">泉城智慧出行</div>
        <div class="brand-sub">Jinan Smart Travel</div>
      </div>

      <!-- 登录/注册切换 -->
      <div class="tabs">
        <div class="tab" :class="{ active: mode === 'login' }" @click="switchMode('login')">登录</div>
        <div class="tab" :class="{ active: mode === 'register' }" @click="switchMode('register')">注册</div>
        <div class="tab-slider" :class="{ right: mode === 'register' }"></div>
      </div>

      <el-form @submit.prevent>
        <el-form-item>
          <el-input v-model="username" placeholder="用户名" :prefix-icon="User" size="large" />
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="password"
            type="password"
            show-password
            placeholder="密码"
            :prefix-icon="Lock"
            size="large"
            @keyup.enter="submit"
          />
        </el-form-item>

        <!-- 验证码 -->
        <el-form-item>
          <div class="captcha-row">
            <el-input
              v-model="captcha"
              placeholder="验证码"
              :prefix-icon="Key"
              size="large"
              @keyup.enter="submit"
            />
            <div class="captcha-img" title="点击刷新验证码" @click="refreshCaptcha" v-html="captchaSvg"></div>
          </div>
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          :loading="loading"
          @click="submit"
        >
          {{ mode === 'login' ? '登 录' : '注 册' }}
        </el-button>
      </el-form>

      <div class="tip">账号密码可在本站自行注册，验证码不区分大小写</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Key } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const mode = ref('login')
const username = ref('')
const password = ref('')
const captcha = ref('')
const captchaSvg = ref('')
const captchaId = ref('')
const loading = ref(false)

function switchMode(m) {
  mode.value = m
  captcha.value = ''
  refreshCaptcha()
}

async function refreshCaptcha() {
  try {
    const res = await fetch('/api/captcha')
    const data = await res.json()
    if (data.code === 0) {
      captchaId.value = data.captchaId
      captchaSvg.value = data.svg
      captcha.value = ''
    }
  } catch (e) {
    ElMessage.error('验证码加载失败，请检查后端是否启动')
  }
}

async function submit() {
  if (!username.value.trim()) return ElMessage.warning('请输入用户名')
  if (!password.value) return ElMessage.warning('请输入密码')
  if (!captcha.value.trim()) return ElMessage.warning('请输入验证码')

  loading.value = true
  try {
    const url = mode.value === 'login' ? '/api/login' : '/api/register'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value.trim(),
        password: password.value,
        captchaId: captchaId.value,
        captcha: captcha.value.trim(),
      }),
    })
    const data = await res.json()

    if (data.code === 0) {
      if (mode.value === 'login') {
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.username)
        ElMessage.success('登录成功')
        router.replace('/')
      } else {
        ElMessage.success('注册成功，请登录')
        switchMode('login')
        password.value = ''
      }
    } else {
      ElMessage.error(data.msg || '操作失败')
      refreshCaptcha()
    }
  } catch (e) {
    ElMessage.error('网络错误，请确认后端已启动')
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(refreshCaptcha)
</script>

<style scoped>
.login-wrap {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(0, 120, 255, 0.25), transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(0, 200, 180, 0.18), transparent 50%),
    linear-gradient(135deg, #0b1220 0%, #101a2e 50%, #0b1220 100%);
}

.login-card {
  width: 380px;
  padding: 36px 32px 28px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.brand {
  text-align: center;
  margin-bottom: 24px;
}
.brand-title {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 3px;
}
.brand-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 2px;
  margin-top: 4px;
}

.tabs {
  position: relative;
  display: flex;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}
.tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  font-size: 15px;
  transition: color 0.25s;
  z-index: 1;
}
.tab.active {
  color: #fff;
  font-weight: 600;
}
.tab-slider {
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(135deg, #1f7ae0, #23b8a0);
  transition: transform 0.3s ease;
}
.tab-slider.right {
  transform: translateX(100%);
}

.captcha-row {
  display: flex;
  gap: 10px;
  width: 100%;
}
.captcha-img {
  flex-shrink: 0;
  width: 120px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
  letter-spacing: 6px;
  font-size: 16px;
  background: linear-gradient(135deg, #1f7ae0, #23b8a0);
  border: none;
}

.tip {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

:deep(.el-input__wrapper) {
  background: rgba(0, 0, 0, 0.25);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
}
:deep(.el-input__inner) {
  color: #fff;
}
:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}
</style>
