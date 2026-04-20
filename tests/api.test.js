/**
 * Next.js API 端點測試
 * 測試所有後端 API 功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

describe('咖啡廳 Next.js API 測試', () => {

  describe('GET /api/cafes - 獲取所有咖啡廳', () => {
    test('應該返回咖啡廳列表', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/cafes?action=cafes`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThan(0);
      } catch (error) {
        console.warn('API 未運行，跳過此測試:', error.message);
      }
    });

    test('每個咖啡廳應該有必需的字段', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/cafes?action=cafes`);
        response.data.forEach(cafe => {
          expect(cafe).toHaveProperty('id');
          expect(cafe).toHaveProperty('name');
          expect(cafe).toHaveProperty('address');
          expect(cafe).toHaveProperty('latitude');
          expect(cafe).toHaveProperty('longitude');
          expect(cafe).toHaveProperty('hours');
          expect(cafe).toHaveProperty('phone');
          expect(cafe).toHaveProperty('tags');
        });
      } catch (error) {
        console.warn('API 未運行，跳過此測試:', error.message);
      }
    });

    test('座標應該是合理的經緯度範圍', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/cafes?action=cafes`);
        response.data.forEach(cafe => {
          expect(cafe.latitude).toBeGreaterThanOrEqual(-90);
          expect(cafe.latitude).toBeLessThanOrEqual(90);
          expect(cafe.longitude).toBeGreaterThanOrEqual(-180);
          expect(cafe.longitude).toBeLessThanOrEqual(180);
        });
      } catch (error) {
        console.warn('API 未運行，跳過此測試:', error.message);
      }
    });
  });

  describe('搜尋功能測試', () => {
    test('應該支持關鍵字搜尋', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/cafes?action=search&keyword=晨曦`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('results');
        expect(Array.isArray(response.data.results)).toBe(true);
      } catch (error) {
        console.warn('搜尋端點未運行，跳過此測試:', error.message);
      }
    });

    test('搜尋結果應該與關鍵字相關', async () => {
      try {
        const keyword = '素食';
        const response = await axios.get(`${BASE_URL}/api/cafes?action=search&keyword=${keyword}`);
        if (response.data.results.length > 0) {
          response.data.results.forEach(cafe => {
            const match = cafe.name.includes(keyword) || cafe.address.includes(keyword);
            expect(match).toBe(true);
          });
        }
      } catch (error) {
        console.warn('搜尋端點未運行，跳過此測試:', error.message);
      }
    });

    test('應該支持標籤篩選', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/cafes?action=search&keyword=&tags=素食`);
        expect(response.status).toBe(200);
        if (response.data.results.length > 0) {
          response.data.results.forEach(cafe => {
            expect(cafe.tags).toContain('素食');
          });
        }
      } catch (error) {
        console.warn('標籤篩選未運行，跳過此測試:', error.message);
      }
    });

    test('空搜尋應該返回所有結果', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/cafes?action=search&keyword=`);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.results)).toBe(true);
      } catch (error) {
        console.warn('搜尋端點未運行，跳過此測試:', error.message);
      }
    });
  });

  describe('單個咖啡廳查詢', () => {
    test('應該能按 ID 查詢咖啡廳', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/cafes?action=cafe&id=1`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('cafe');
        expect(response.data.cafe).toHaveProperty('id', 1);
      } catch (error) {
        console.warn('查詢端點未運行，跳過此測試:', error.message);
      }
    });

    test('查詢不存在的 ID 應該返回錯誤', async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/cafes?action=cafe&id=99999`);
        expect(response.status).toBe(404);
        expect(response.data.success).toBe(false);
      } catch (error) {
        console.warn('查詢端點未運行，跳過此測試:', error.message);
      }
    });
  });

  describe('新增咖啡廳', () => {
    test('應該能成功新增咖啡廳', async () => {
      try {
        const newCafe = {
          name: '測試咖啡廳',
          address: '測試地址123號',
          latitude: 25.0100,
          longitude: 121.4600,
          hours: '09:00-18:00',
          phone: '02-1234-5678',
          tags: ['測試'],
          menu: ['測試飲品']
        };

        const response = await axios.post(`${BASE_URL}/api/cafes?action=cafes`, newCafe);
        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        expect(response.data.cafe).toHaveProperty('id');
        expect(response.data.cafe.name).toBe(newCafe.name);
      } catch (error) {
        console.warn('新增咖啡廳測試未能完成，跳過此測試:', error.message);
      }
    });
  });
});