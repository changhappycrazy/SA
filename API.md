# API 文檔

## 基本信息

**基 URL**: `http://localhost/SA/`
**內容類型**: `application/json`
**字符編碼**: UTF-8

---

## 認證端點

### 1. 用戶註冊

**端點**: `POST /api.php?action=register`

**請求體**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "user"
}
```

**參數說明**:
| 參數 | 類型 | 必需 | 說明 |
|------|------|------|------|
| email | string | 是 | 用戶郵箱地址 |
| password | string | 是 | 用戶密碼（至少6位） |
| role | string | 否 | 用戶角色：user/shop_owner/admin，默認為 user |

**成功響應 (200)**:
```json
{
  "success": true,
  "user_id": 1,
  "role": "user"
}
```

**錯誤響應**:
```json
{
  "success": false,
  "error": "郵箱已被註冊"
}
```

### 2. 用戶登入

**端點**: `POST /api.php?action=login`

**請求體**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**成功響應 (200)**:
```json
{
  "success": true,
  "user_id": 1,
  "role": "user"
}
```

**錯誤響應**:
```json
{
  "success": false,
  "error": "郵箱或密碼錯誤"
}
```

---

## 咖啡廳資料端點

### 3. 獲取所有咖啡廳

**端點**: `GET /api.php`

**查詢參數**: 無

**成功響應 (200)**:
```json
[
  {
    "id": 1,
    "name": "晨曦咖啡",
    "address": "板橋區重慶路100號",
    "lat": 25.0119,
    "lon": 121.4637,
    "hours": "07:00-21:00",
    "phone": "02-1234-5678",
    "tags": ["安靜", "插座", "免費WiFi"],
    "menu": ["美式咖啡", "拿鐵", "卡布奇諾"]
  },
  ...
]
```

### 4. 按 ID 查詢咖啡廳

**端點**: `GET /api.php?action=cafe&id={id}`

**查詢參數**:
| 參數 | 類型 | 說明 |
|------|------|------|
| id | integer | 咖啡廳 ID |

**成功響應 (200)**:
```json
{
  "success": true,
  "cafe": {
    "id": 1,
    "name": "晨曦咖啡",
    "address": "板橋區重慶路100號",
    "lat": 25.0119,
    "lon": 121.4637,
    "hours": "07:00-21:00",
    "phone": "02-1234-5678",
    "tags": ["安靜", "插座", "免費WiFi"],
    "menu": ["美式咖啡", "拿鐵", "卡布奇諾"]
  }
}
```

### 5. 新增咖啡廳

**端點**: `POST /api.php?action=cafe`

**請求體**:
```json
{
  "name": "新咖啡廳",
  "address": "板橋區某路某號",
  "lat": 25.0100,
  "lon": 121.4600,
  "hours": "08:00-20:00",
  "phone": "02-9999-8888",
  "tags": ["安靜", "插座"],
  "menu": ["黑咖啡", "卡布奇諾"]
}
```

**成功響應 (200)**:
```json
{
  "success": true,
  "cafe": {
    "id": 4,
    "name": "新咖啡廳",
    ...
  }
}
```

---

## 搜尋與篩選端點

### 6. 搜尋咖啡廳

**端點**: `GET /api.php?action=search`

**查詢參數**:
| 參數 | 類型 | 說明 |
|------|------|------|
| keyword | string | 搜尋關鍵字（店名或地址） |
| tags | string | 標籤篩選（逗號分隔，使用 AND 邏輯） |

**示例**:
```
GET /api.php?action=search?keyword=咖啡&tags=安靜,插座
```

**成功響應 (200)**:
```json
{
  "success": true,
  "results": [
    {
      "id": 1,
      "name": "晨曦咖啡",
      "address": "板橋區重慶路100號",
      "lat": 25.0119,
      "lon": 121.4637,
      "hours": "07:00-21:00",
      "phone": "02-1234-5678",
      "tags": ["安靜", "插座", "免費WiFi"],
      "menu": ["美式咖啡", "拿鐵", "卡布奇諾"]
    }
  ]
}
```

---

## 用戶管理端點

### 7. 獲取所有用戶 (管理員)

**端點**: `GET /api.php?action=users`

**成功響應 (200)**:
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "role": "user",
      "created_at": "2026-04-14 10:30:00"
    },
    {
      "id": 2,
      "email": "owner@example.com",
      "role": "shop_owner",
      "created_at": "2026-04-14 11:00:00"
    }
  ]
}
```

---

## 數據定義

### 咖啡廳對象

```typescript
interface Cafe {
  id: number;                    // 唯一標識符
  name: string;                  // 店名
  address: string;               // 地址
  lat: number;                   // 緯度 (-90 to 90)
  lon: number;                   // 經度 (-180 to 180)
  hours: string;                 // 營業時間 (HH:MM-HH:MM)
  phone: string;                 // 電話號碼
  tags: string[];                // 環境標籤
  menu: string[];                // 菜單項目
}
```

### 用戶對象

```typescript
interface User {
  id: number;                    // 用戶ID
  email: string;                 // 郵箱地址
  password: string;              // 加密密碼 (bcrypt)
  role: string;                  // 角色 (user/shop_owner/admin)
  created_at: string;            // 建立時間
}
```

### 角色定義

| 角色 | 描述 |
|------|------|
| user | 普通用戶，可搜尋和瀏覽咖啡廳 |
| shop_owner | 店家老闆，可管理自己的咖啡廳信息 |
| admin | 管理員，擁有全部權限 |

### 環境標籤

| 標籤 | 說明 |
|------|------|
| 安靜 | 適合工作或安靜環境 |
| 插座 | 提供電源插座 |
| 素食 | 提供素食選項 |
| 免費WiFi | 提供免費無線網絡 |
| 人多 | 繁華的熱鬧環境 |
| 舒適 | 舒適的座位環境 |

---

## 錯誤代碼

| 代碼 | 說明 |
|------|------|
| 200 | 請求成功 |
| 400 | 請求參數錯誤 |
| 401 | 未授權 |
| 403 | 禁止訪問 |
| 404 | 資源不存在 |
| 500 | 服務器內部錯誤 |

---

## 使用示例

### JavaScript/Fetch

```javascript
// 搜尋咖啡廳
fetch('http://localhost/SA/api.php?action=search&keyword=咖啡&tags=安靜')
  .then(res => res.json())
  .then(data => console.log(data.results));

// 用戶註冊
fetch('http://localhost/SA/api.php?action=register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    role: 'user'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### cURL

```bash
# 獲取所有咖啡廳
curl http://localhost/SA/api.php

# 搜尋咖啡廳
curl "http://localhost/SA/api.php?action=search&keyword=咖啡&tags=安靜"

# 用戶註冊
curl -X POST http://localhost/SA/api.php?action=register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","role":"user"}'

# 用戶登入
curl -X POST http://localhost/SA/api.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

## 速率限制

目前無速率限制，但建議生產環境中實施：
- 每個 IP 每分鐘最多 60 個請求
- 認證端點每個 IP 每小時最多 10 個請求

---

## 版本歷史

| 版本 | 日期 | 變更 |
|------|------|------|
| 1.0 | 2026-04-14 | 初始版本（Sprint1） |

---

**最後更新**: 2026-04-14
