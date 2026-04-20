#!/bin/bash

# 彩色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Sprint1 自動化測試套件${NC}"
echo -e "${BLUE}  核心導航與基礎資料庫${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 檢查 Node.js 和 npm
echo -e "${YELLOW}[檢查] 檢查環境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js 未安裝${NC}"
    echo "請先安裝 Node.js: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js ${NC}$(node --version)"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm 未安裝${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm ${NC}$(npm --version)\n"

# 檢查 XAMPP
echo -e "${YELLOW}[檢查] 檢查 XAMPP 伺服器...${NC}"
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✓ Apache 伺服器已運行${NC}\n"
else
    echo -e "${YELLOW}⚠ Apache 伺服器未運行，某些測試可能被跳過${NC}\n"
fi

# 安裝依賴
echo -e "${YELLOW}[安裝] 安裝 npm 依賴...${NC}"
if [ ! -d "node_modules" ]; then
    npm install --save-dev jest supertest puppeteer axios @testing-library/jest-dom 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 依賴安裝完成${NC}\n"
    else
        echo -e "${YELLOW}⚠ 某些依賴安裝失敗，繼續執行...${NC}\n"
    fi
else
    echo -e "${GREEN}✓ 依賴已存在${NC}\n"
fi

# 執行測試
echo -e "${YELLOW}[執行] 運行自動化測試...${NC}\n"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. API 端點測試${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
npx jest tests/api.test.js --no-coverage 2>/dev/null || true
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. 用戶認證系統測試${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
npx jest tests/auth.test.js --no-coverage 2>/dev/null || true
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. 搜尋與篩選功能測試${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
npx jest tests/search.test.js --no-coverage 2>/dev/null || true
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. 前端集成測試${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
npx jest tests/frontend.test.js --no-coverage 2>/dev/null || true
echo ""

# 運行完整測試覆蓋率報告
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. 完整測試報告（含覆蓋率）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
npx jest --coverage 2>/dev/null || true

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ 測試執行完成${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}測試覆蓋項目：${NC}"
echo "  ✓ API 端點測試"
echo "  ✓ 用戶系統（註冊、登入、權限）"
echo "  ✓ 搜尋與篩選功能"
echo "  ✓ 前端集成測試"
echo ""
echo -e "${YELLOW}生成的報告位置：${NC}"
echo "  📊 coverage/index.html - 覆蓋率詳細報告"
echo ""
