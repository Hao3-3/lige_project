@echo off
chcp 65001 >nul
title 初始化数据库 jncity
cd /d %~dp0

echo ============================================
echo   初始化数据库（仅需第一次运行）
echo ============================================
echo 前置条件：已安装并启动 SQL Server（1433），
echo 且已把 server\db.js 里的 sa 密码改成本机密码。
echo.

where node >nul 2>nul
if errorlevel 1 ( echo [错误] 未检测到 Node.js，请先安装 & pause & exit /b 1 )

if not exist server\node_modules (
  echo 安装后端依赖...
  pushd server
  call npm install
  popd
)

echo 创建数据库与基础表...
call npm run initdb
if errorlevel 1 ( echo [错误] initdb 失败，请检查 SQL Server 是否启动、sa 密码是否正确 & pause & exit /b 1 )

echo 创建扩展表（事件/班次/公告/收藏/历史）...
call npm run initextra

echo 创建交通事件表...
call npm run initevents

echo.
echo ============================================
echo   数据库初始化完成，接下来双击「一键启动.bat」
echo ============================================
pause
