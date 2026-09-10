@echo off
chcp 65001 >nul
title 泉城智慧出行 - 一键启动
cd /d %~dp0

echo ============================================
echo   泉城智慧出行 一键启动
echo ============================================

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先到 https://nodejs.org 安装 18 及以上版本。
  pause
  exit /b 1
)

if not exist node_modules (
  echo [1/3] 首次运行，安装前端依赖，请耐心等待...
  call npm install
  if errorlevel 1 ( echo [错误] 前端依赖安装失败 & pause & exit /b 1 )
) else (
  echo [1/3] 前端依赖已存在，跳过安装
)

if not exist server\node_modules (
  echo [2/3] 安装后端依赖...
  pushd server
  call npm install
  popd
) else (
  echo [2/3] 后端依赖已存在，跳过安装
)

echo [3/3] 启动开发服务（后端会自动拉起，浏览器将打开 http://localhost:5173）
echo 关闭本窗口即可停止服务。
call npm run dev
pause
