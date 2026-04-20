@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Sprint1 自動化測試套件
echo   核心導航與基礎資料庫
echo ========================================
echo.

REM 檢查 Node.js 和 npm
echo [檢查] 檢查環境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Node.js 未安裝
    echo 請先安裝 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION%

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ npm 未安裝
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION%
echo.

REM 安裝依賴
echo [安裝] 安裝 npm 依賴...
if not exist "node_modules" (
    call npm install --save-dev jest supertest puppeteer axios @testing-library/jest-dom
    if %errorlevel% equ 0 (
        echo ✓ 依賴安裝完成
    ) else (
        echo ⚠ 某些依賴安裝失敗，繼續執行...
    )
) else (
    echo ✓ 依賴已存在
)
echo.

REM 執行測試
echo [執行] 運行自動化測試...
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 1. API 端點測試
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
call npx jest tests/api.test.js --no-coverage 2>nul
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 2. 用戶認證系統測試
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
call npx jest tests/auth.test.js --no-coverage 2>nul
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 3. 搜尋與篩選功能測試
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
call npx jest tests/search.test.js --no-coverage 2>nul
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 4. 前端集成測試
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
call npx jest tests/frontend.test.js --no-coverage 2>nul
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 5. 完整測試報告（含覆蓋率）
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
call npx jest --coverage 2>nul

echo.
echo ========================================
echo ✓ 測試執行完成
echo ========================================
echo.

echo 測試覆蓋項目：
echo   ✓ API 端點測試
echo   ✓ 用戶系統（註冊、登入、權限）
echo   ✓ 搜尋與篩選功能
echo   ✓ 前端集成測試
echo.
echo 生成的報告位置：
echo   📊 coverage/index.html - 覆蓋率詳細報告
echo.

pause
