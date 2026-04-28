import requests
from supabase import create_client, Client

# 1. 配置你的 Supabase 鑰匙
url: str = "https://xyqmabihbnmeuzptqqpb.supabase.co"
key: str = "sb_publishable_P16AEtvOSHqDUmjdBalR9w_tE8Wdppy"
supabase: Client = create_client(url, key)

def fetch_and_sync():
    print("🚀 啟動自動化抓取：板橋區咖啡廳...")

    # 2. 向 Overpass API 請求資料 (半徑已幫你改成 5000)
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = """
    [out:json];
    node["amenity"="cafe"](around:5000, 25.0131, 121.4670);
    out body;
    """
    
    try:
        # --- 抓取階段 ---
        response = requests.get(overpass_url, params={'data': query})
        response.raise_for_status()
        data = response.json()
        
        raw_elements = data.get('elements', [])
        print(f"📡 成功從雲端獲取 {len(raw_elements)} 筆原始資料")

        # --- 整理階段 ---
        cafes_to_upsert = []
        for el in raw_elements:
            tags = el.get('tags', {})
            cafes_to_upsert.append({
                "name": tags.get('name', '未命名咖啡廳'),
                "lat": el.get('lat'),
                "lng": el.get('lon'),
                "address": tags.get('addr:full', '板橋區 (詳細地址請參考地圖)')
            })

        # --- 同步階段 ---
        print(f"📦 準備將 {len(cafes_to_upsert)} 筆資料送往 Supabase...")
        
        # 執行 Upsert
        db_response = supabase.table('cafes').upsert(cafes_to_upsert).execute()
        
        print(f"📢 Supabase 回傳結果：{db_response}")
        print(f"✅ 全自動同步完成！")

    except Exception as e:
        # 如果 try 裡面任何一個地方出錯，都會跳到這裡
        print(f"❌ 發生錯誤：{e}")

if __name__ == "__main__":
    fetch_and_sync()