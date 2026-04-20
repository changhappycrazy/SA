import Head from 'next/head';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xyqmabihbnmeuzptqqpb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cW1hYmloYm5tZXV6cHRxcXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0Nzg2MzMsImV4cCI6MjA5MTA1NDYzM30.p5lTli-IXyY_LVU3PSR6DKwKyxmcFHkXy0-EGrXH48s';

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

  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const mapContainerId = 'map';

  const handleToggleTag = (tag) => {
    setSelectedTags((current) => {
      const next = new Set(current);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const resetFilters = () => {
    setSelectedTags(new Set());
    setSearchText('');
  };

  const applyFilters = () => {
    if (!mapRef.current) return;
    const keyword = searchText.toLowerCase().trim();
    const tags = Array.from(selectedTags);
    markersRef.current.forEach((marker) => {
      const cafe = marker.cafeData;
      const matchKeyword =
        cafe.name.toLowerCase().includes(keyword) ||
        (cafe.address || '').toLowerCase().includes(keyword);
      const matchTags = tags.every((tag) => cafe.tags?.includes(tag));
      const visible = matchKeyword && matchTags;
      if (visible) {
        marker.addTo(mapRef.current);
      } else {
        marker.remove();
      }
    });
  };

  const loadData = async () => {
    const { data, error } = await supabase.from('cafes').select('*');
    if (error) {
      setLoadStatus('❌ 載入失敗');
      return;
    }
    setLoadStatus(`✅ 已載入 ${data.length} 筆資料`);
    markersRef.current = [];

    data.forEach((cafe) => {
      const marker = window.L.circleMarker([cafe.latitude, cafe.longitude], {
        radius: 8,
        fillColor: '#0891b2',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.8
      });
      marker
        .bindPopup(`<b>${cafe.name}</b><br><small>${cafe.address || ''}</small>`)
        .addTo(mapRef.current);
      marker.cafeData = cafe;
      markersRef.current.push(marker);
    });

    applyFilters();
  };

  const checkUser = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (session) {
      setUser({
        full_name: session.user.user_metadata.full_name || session.user.email,
        avatar_url: session.user.user_metadata.avatar_url || '/favicon.ico'
      });
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  useEffect(() => {
    if (!mapReady || mapRef.current) return;
    const map = window.L.map(mapContainerId, { zoomControl: false }).setView([25.0119, 121.4637], 15);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    window.L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    loadData();
    checkUser();
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    applyFilters();
  }, [searchText, selectedTags, mapReady]);

  const filterClass = (tag) =>
    selectedTags.has(tag)
      ? 'filter-btn active border rounded-xl py-2.5 flex flex-col items-center bg-white'
      : 'filter-btn border rounded-xl py-2.5 flex flex-col items-center bg-white';

  return (
    <>
      <Head>
        <title>板橋咖啡地圖 - Next.js 版</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>

      <div id="map" className="absolute inset-0 z-0" />

      <div className="fixed top-5 right-5 z-50 flex items-center gap-3">
        <div
          id="user-info"
          className={`${
            user ? 'flex' : 'hidden'
          } bg-white/90 backdrop-blur px-3 py-2 rounded-full shadow-lg border border-cyan-100 items-center gap-3`}
        >
          <img id="user-avatar" src={user?.avatar_url || ''} alt="User avatar" className="w-8 h-8 rounded-full border border-cyan-200" />
          <div className="flex flex-col">
            <span id="user-name" className="text-[10px] font-bold text-gray-700 leading-tight">
              {user?.full_name}
            </span>
            <button onClick={handleLogout} className="text-[9px] text-red-500 hover:underline text-left">
              登出
            </button>
          </div>
        </div>
        <button
          id="login-btn"
          onClick={handleLogin}
          className={`${user ? 'hidden' : 'flex'} bg-white text-cyan-600 px-5 py-2.5 rounded-full font-bold shadow-xl hover:bg-cyan-50 transition flex items-center gap-2 border border-cyan-100`}
        >
          <i className="fab fa-google" /> Google 登入
        </button>
      </div>

      <div className="fixed top-5 left-5 w-80 bg-white/95 backdrop-blur shadow-2xl rounded-2xl flex flex-col z-40 max-h-[92vh]">
        <div className="p-5 border-b">
          <h2 className="text-xl font-black text-gray-800">板橋咖啡地圖</h2>
          <p id="load-status" className="text-[10px] text-cyan-600 font-bold mt-1 uppercase tracking-widest">
            {loadStatus}
          </p>
        </div>

        <div className="p-4 border-b">
          <input
            type="text"
            id="search-input"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜尋店名或地址..."
            className="w-full bg-gray-100 border-none rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
          />
        </div>

        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
          {CATEGORY_SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">{section.title}</h3>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {section.items.map((item) => (
                  <button key={item.key} type="button" onClick={() => handleToggleTag(item.key)} className={filterClass(item.key)}>
                    <i className={`${item.icon} mb-1`} />
                    {item.key}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="p-4 border-t bg-gray-50 flex gap-2 rounded-b-2xl">
          <button type="button" onClick={resetFilters} className="flex-1 text-gray-400 text-xs font-bold">
            重置
          </button>
          <button type="button" onClick={applyFilters} className="flex-[2] bg-cyan-600 text-white py-2.5 rounded-xl font-black text-sm shadow-md">
            確認篩選
          </button>
        </div>
      </div>

      <Script
        src="https://unpkg.com/leaflet/dist/leaflet.js"
        strategy="afterInteractive"
        onLoad={() => setMapReady(true)}
      />
    </>
  );
}
