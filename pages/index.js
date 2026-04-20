import Head from 'next/head';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase 配置 ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FILTER_BUTTONS = [
  { key: '插座多', icon: 'fas fa-plug' },
  { key: '收訊不錯', icon: 'fas fa-wifi' },
  { key: '安靜程度', icon: 'fas fa-volume-down' },
  { key: '不限時', icon: 'fas fa-clock' },
  { key: '提供輕食', icon: 'fas fa-utensils' },
  { key: '提供素食', icon: 'fas fa-leaf text-green-500' },
  { key: '無低消', icon: 'fas fa-coins' },
  { key: '低消一杯飲', icon: 'fas fa-mug-hot' },
  { key: '外文對應', icon: 'fas fa-language' },
  { key: '寵物友善', icon: 'fas fa-paw text-orange-400' }
];

const CATEGORY_SECTIONS = [
  { title: '環境現況', items: FILTER_BUTTONS.slice(0, 4) },
  { title: '餐點與消費', items: FILTER_BUTTONS.slice(4, 8) },
  { title: '特色服務', items: FILTER_BUTTONS.slice(8, 10) }
];

export default function Home() {
  const [loadStatus, setLoadStatus] = useState('正在連線雲端...');
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [user, setUser] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [registrationStep, setRegistrationStep] = useState('loading'); 
  const [formData, setFormData] = useState({ username: '', referralCode: '' });
  const [error, setError] = useState('');

  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // --- 1. 檢查使用者身分 ---
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      
      // 關鍵邏輯：必須資料存在且角色不是 pending 才算完成
      if (data && data.role !== 'pending') {
        setUser({ 
          ...data, 
          avatar_url: session.user.user_metadata.avatar_url || 'https://www.gravatar.com/avatar/?d=mp' 
        });
        setRegistrationStep('done');
      } else {
        setRegistrationStep('role');
      }
    } else {
      setRegistrationStep('login');
    }
  };

  // --- 2. 登入與註冊動作 (使用 upsert) ---
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo: window.location.origin } 
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleCustomerRegister = async (e) => {
    e.preventDefault();
    setError('');
    const { data: { session } } = await supabase.auth.getSession();
    
    // upsert 會檢查 ID，如果沒有這筆就 insert，有了就 update
    const { error } = await supabase.from('users').upsert({
      id: session.user.id,
      email: session.user.email,
      name: formData.username,
      role: 'customer'
    });

    if (error) setError('寫入失敗: ' + error.message);
    else window.location.reload();
  };

  const handleStoreRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.referralCode !== '3333') { setError('推薦碼錯誤'); return; }
    
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('users').upsert({
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata.full_name || '店家使用者',
      role: 'store'
    });

    if (error) setError('驗證失敗: ' + error.message);
    else window.location.reload();
  };

  // --- 3. 地圖載入與篩選 ---
  const loadData = async () => {
    const { data, error } = await supabase.from('cafes').select('*');
    if (error) { setLoadStatus('❌ 載入失敗'); return; }
    setLoadStatus(`✅ 已載入 ${data.length} 筆資料`);
    data.forEach((cafe) => {
      const marker = window.L.circleMarker([cafe.latitude, cafe.longitude], { 
        radius: 8, fillColor: '#0891b2', color: '#fff', weight: 2, fillOpacity: 0.8 
      });
      marker.bindPopup(`<b>${cafe.name}</b><br><span class="text-xs">${cafe.address || ''}</span>`).addTo(mapRef.current);
      marker.cafeData = cafe;
      markersRef.current.push(marker);
    });
  };

  const applyFilters = () => {
    if (!mapRef.current) return;
    const keyword = searchText.toLowerCase().trim();
    const tags = Array.from(selectedTags);
    markersRef.current.forEach((marker) => {
      const cafe = marker.cafeData;
      const matchKeyword = cafe.name.toLowerCase().includes(keyword) || (cafe.address || '').toLowerCase().includes(keyword);
      const matchTags = tags.every((tag) => cafe.tags?.includes(tag));
      if (matchKeyword && matchTags) marker.addTo(mapRef.current);
      else marker.remove();
    });
  };

  useEffect(() => {
    if (!mapReady || mapRef.current) return;
    const map = window.L.map('map', { zoomControl: false }).setView([25.0119, 121.4637], 15);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    window.L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    loadData();
    checkUser();
  }, [mapReady]);

  useEffect(() => {
    if (mapReady) applyFilters();
  }, [searchText, Array.from(selectedTags).join(','), mapReady]);

  return (
    <>
      <Head>
        <title>板橋咖啡地圖</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>

      <div id="map" className="absolute inset-0 z-0" />

      {/* --- 註冊與登入遮罩層 --- */}
      {registrationStep !== 'done' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center">
            
            {registrationStep === 'loading' && <p className="animate-pulse text-gray-400">正在連線中...</p>}

            {registrationStep === 'login' && (
              <>
                <div className="w-20 h-20 bg-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-cyan-600">
                  <i className="fas fa-coffee text-4xl"></i>
                </div>
                <h2 className="text-3xl font-black mb-2 text-gray-800">板橋咖啡地圖</h2>
                <p className="text-gray-400 mb-8 text-sm">請先登入以使用完整功能</p>
                <button onClick={handleLogin} className="w-full py-4 bg-white border-2 border-gray-100 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition shadow-sm">
                  <img src="https://www.google.com/favicon.ico" className="w-5" /> 使用 Google 登入
                </button>
              </>
            )}

            {registrationStep === 'role' && (
              <>
                <h2 className="text-2xl font-bold mb-8">請問您的身分是？</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setRegistrationStep('customer_form')} className="p-8 bg-cyan-50 text-cyan-600 rounded-3xl border-2 border-cyan-100 font-bold hover:border-cyan-500 transition">
                    <i className="fas fa-user-graduate text-3xl mb-3"></i><br/>一般顧客
                  </button>
                  <button onClick={() => setRegistrationStep('store_form')} className="p-8 bg-orange-50 text-orange-600 rounded-3xl border-2 border-orange-100 font-bold hover:border-orange-500 transition">
                    <i className="fas fa-store text-3xl mb-3"></i><br/>店家夥伴
                  </button>
                </div>
                <button onClick={handleLogout} className="mt-6 text-xs text-gray-400 underline">切換帳號</button>
              </>
            )}

            {registrationStep === 'customer_form' && (
              <form onSubmit={handleCustomerRegister} className="text-left">
                <h2 className="text-xl font-bold mb-2 text-center">顧客註冊</h2>
                <p className="text-gray-400 text-xs text-center mb-6">請設定一個顯示在地圖上的暱稱</p>
                <input type="text" placeholder="例如：拿鐵狂熱者" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl mb-4 focus:border-cyan-500 outline-none transition" required onChange={e => setFormData({...formData, username: e.target.value})} />
                {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}
                <button type="submit" className="w-full py-4 bg-cyan-600 text-white rounded-2xl font-bold shadow-lg">開始探索</button>
                <button type="button" onClick={() => setRegistrationStep('role')} className="w-full mt-4 text-sm text-gray-400">返回上一步</button>
              </form>
            )}

            {registrationStep === 'store_form' && (
              <form onSubmit={handleStoreRegister} className="text-left">
                <h2 className="text-xl font-bold mb-2 text-center">店家身分驗證</h2>
                <p className="text-gray-400 text-xs text-center mb-6">請輸入管理員核發的推薦碼 (3333)</p>
                <input type="text" placeholder="推薦碼" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl mb-4 text-center text-2xl tracking-widest outline-none" required onChange={e => setFormData({...formData, referralCode: e.target.value})} />
                {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}
                <button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-lg">完成驗證</button>
                <button type="button" onClick={() => setRegistrationStep('role')} className="w-full mt-4 text-sm text-gray-400">返回上一步</button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* --- 側邊欄 UI --- */}
      <div className="fixed top-5 left-5 w-80 bg-white/95 backdrop-blur shadow-2xl rounded-2xl flex flex-col z-40 max-h-[92vh]">
        <div className="p-5 border-b">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-black text-gray-800">板橋咖啡地圖</h2>
            {user && <img src={user.avatar_url} className="w-8 h-8 rounded-full border border-cyan-100 shadow-sm" />}
          </div>
          <p className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest">{loadStatus}</p>
          {user && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600">
                {user.name} 
                <span className={`px-2 py-0.5 rounded text-[9px] ml-1 ${user.role === 'store' ? 'bg-orange-100 text-orange-600' : 'bg-cyan-100 text-cyan-600'}`}>
                  {user.role === 'store' ? '店家' : '顧客'}
                </span>
              </span>
              <button onClick={handleLogout} className="text-[10px] text-red-400 hover:underline">登出</button>
            </div>
          )}
        </div>
        
        <div className="p-4 border-b">
          <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜尋店名、地址..." className="w-full bg-gray-100 border-none rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
        </div>

        <div className="p-5 space-y-6 overflow-y-auto flex-grow custom-scrollbar">
          {CATEGORY_SECTIONS.map(s => (
            <section key={s.title}>
              <h3 className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">{s.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                {s.items.map(i => (
                  <button key={i.key} onClick={() => {
                    setSelectedTags((prev) => {
                      const next = new Set(prev);
                      if (next.has(i.key)) next.delete(i.key); else next.add(i.key);
                      return next;
                    });
                  }} className={`py-2 rounded-xl text-[10px] border transition flex flex-col items-center gap-1 ${selectedTags.has(i.key) ? 'bg-cyan-50 border-cyan-500 text-cyan-600 font-bold' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}>
                    <i className={i.icon}></i>
                    {i.key}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={() => { setSelectedTags(new Set()); setSearchText(''); }} className="w-full text-gray-400 text-xs font-bold mb-3 hover:text-gray-600">清除所有篩選</button>
          <button onClick={applyFilters} className="w-full bg-cyan-600 text-white py-3 rounded-xl font-black text-sm shadow-md hover:bg-cyan-700 transition">更新地圖點位</button>
        </div>
      </div>

      <Script src="https://unpkg.com/leaflet/dist/leaflet.js" strategy="afterInteractive" onLoad={() => setMapReady(true)} />
    </>
  );
}