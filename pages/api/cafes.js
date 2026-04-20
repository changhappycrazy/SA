import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyqmabihbnmeuzptqqpb.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cW1hYmloYm5tZXV6cHRxcXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0Nzg2MzMsImV4cCI6MjA5MTA1NDYzM30.p5lTli-IXyY_LVU3PSR6DKwKyxmcFHkXy0-EGrXH48s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 模擬資料庫（用於測試）
class CafeDatabase {
  static cafes = [
    {
      id: 1,
      name: '晨曦咖啡',
      address: '板橋區重慶路100號',
      latitude: 25.0119,
      longitude: 121.4637,
      hours: '07:00-21:00',
      phone: '02-1234-5678',
      tags: ['安靜', '插座', '免費WiFi'],
      menu: ['美式咖啡', '拿鐵', '卡布奇諾']
    },
    {
      id: 2,
      name: '素食天堂咖啡',
      address: '板橋區南雅南路50號',
      latitude: 25.0089,
      longitude: 121.4650,
      hours: '08:00-18:00',
      phone: '02-8765-4321',
      tags: ['素食', '插座'],
      menu: ['黑咖啡', '素食麵包']
    },
    {
      id: 3,
      name: '繁華咖啡廳',
      address: '板橋區新北大道200號',
      latitude: 25.0150,
      longitude: 121.4620,
      hours: '09:00-22:00',
      phone: '02-9999-8888',
      tags: ['熱鬧', '人多'],
      menu: ['冰咖啡', '特調飲品']
    }
  ];

  static users = [];
  static nextUserId = 1;

  static getAllCafes() {
    return this.cafes;
  }

  static searchCafes(keyword, tags = []) {
    const results = this.cafes.filter(cafe => {
      const nameMatch = cafe.name.toLowerCase().includes(keyword.toLowerCase());
      const addressMatch = cafe.address.toLowerCase().includes(keyword.toLowerCase());

      if (tags.length === 0) {
        return nameMatch || addressMatch;
      }

      const hasAllTags = tags.every(tag => cafe.tags.includes(tag));

      return (nameMatch || addressMatch) && hasAllTags;
    });

    return results;
  }

  static getCafeById(id) {
    return this.cafes.find(cafe => cafe.id === parseInt(id));
  }

  static registerUser(email, password, role = 'user') {
    // 檢查郵箱是否已存在
    const existingUser = this.users.find(user => user.email === email);
    if (existingUser) {
      return { success: false, error: '郵箱已被註冊' };
    }

    const user = {
      id: this.nextUserId++,
      email,
      password: password, // 在實際應用中應該加密
      role,
      created_at: new Date().toISOString()
    };

    this.users.push(user);
    return { success: true, user_id: user.id, role: user.role };
  }

  static loginUser(email, password) {
    const user = this.users.find(u => u.email === email && u.password === password);
    if (user) {
      return { success: true, user_id: user.id, role: user.role };
    }
    return { success: false, error: '郵箱或密碼錯誤' };
  }

  static getAllUsers() {
    return this.users;
  }

  static addCafe(data) {
    const cafe = {
      id: this.cafes.length + 1,
      name: data.name,
      address: data.address,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      hours: data.hours || '09:00-18:00',
      phone: data.phone || '',
      tags: data.tags || [],
      menu: data.menu || []
    };
    this.cafes.push(cafe);
    return { success: true, cafe };
  }
}

export default async function handler(req, res) {
  // 設置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'cafes':
        if (req.method === 'GET') {
          const cafes = CafeDatabase.getAllCafes();
          res.status(200).json(cafes);
        } else if (req.method === 'POST') {
          const result = CafeDatabase.addCafe(req.body);
          res.status(201).json(result);
        }
        break;

      case 'search':
        if (req.method === 'GET') {
          const { keyword = '', tags = '' } = req.query;
          const tagArray = tags ? tags.split(',') : [];
          const results = CafeDatabase.searchCafes(keyword, tagArray);
          res.status(200).json({ success: true, results });
        }
        break;

      case 'cafe':
        if (req.method === 'GET') {
          const { id } = req.query;
          const cafe = CafeDatabase.getCafeById(id);
          if (cafe) {
            res.status(200).json({ success: true, cafe });
          } else {
            res.status(404).json({ success: false, error: '咖啡廳不存在' });
          }
        }
        break;

      case 'register':
        if (req.method === 'POST') {
          const { email, password, role = 'user' } = req.body;
          if (!email || !password) {
            return res.status(400).json({ success: false, error: '郵箱和密碼不能為空' });
          }
          const result = CafeDatabase.registerUser(email, password, role);
          res.status(result.success ? 201 : 400).json(result);
        }
        break;

      case 'login':
        if (req.method === 'POST') {
          const { email, password } = req.body;
          if (!email || !password) {
            return res.status(400).json({ success: false, error: '郵箱和密碼不能為空' });
          }
          const result = CafeDatabase.loginUser(email, password);
          res.status(result.success ? 200 : 401).json(result);
        }
        break;

      case 'users':
        if (req.method === 'GET') {
          const users = CafeDatabase.getAllUsers();
          res.status(200).json({ success: true, users });
        }
        break;

      default:
        res.status(404).json({ error: '端點不存在' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
}
