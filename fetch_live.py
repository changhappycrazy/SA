import requests
from supabase import create_client, Client

# 1. Supabase 連線設定
URL: str = "https://xyqmabihbnmeuzptqqpb.supabase.co"
KEY: str = "sb_publishable_P16AEtvOSHqDUmjdBalR9w_tE8Wdppy"
supabase: Client = create_client(URL, KEY)

def sync_opening_hours():
    print("🚀 開始執行「營業時間」補齊計畫...")
    
    overpass_url = "https://overpass-api.de/api/interpreter"
    
    # 抓取板橋區所有咖啡廳節點
    query = """
    [out:json][timeout:30];
    area["name"="板橋區"]->.searchArea;
    node["amenity"="cafe"](area.searchArea);
    out body;
    """
    
    headers = {
        'User-Agent': 'MIS-Student-Project-Bot/1.0',
        'Accept': 'application/json'
    }

    try:
        print("📡 正在從 Overpass API 獲取最新資料...")
        response = requests.post(overpass_url, data={'data': query}, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        elements = data.get('elements', [])
        
        updated_cafes = []
        blacklist = ["50嵐", "可不可", "清心", "迷客夏", "麻古", "茶", "飲", "Drink", "Tea", "奶茶"]
        
        for el in elements:
            tags = el.get('tags', {})
            name = tags.get('name', '未命名咖啡廳')
            
            # 過濾掉手搖飲
            if any(word in name for word in blacklist) or name == '未命名咖啡廳':
                continue
                
            # 整理資料
            updated_cafes.append({
                "name": name,
                "latitude": el.get('lat'),
                "longitude": el.get('lon'),
                "address": tags.get('addr:full', '新北市板橋區'),
                "opening_hours": tags.get('opening_hours', '暫無資訊') # 抓取時間
            })
        
        print(f"✅ 整理完成，準備更新 {len(updated_cafes)} 筆資料...")

        # 第三步：同步到 Supabase (利用 upsert 自動補齊)
        if updated_cafes:
            supabase.table('cafes').upsert(updated_cafes).execute()
            print("🎉 營業時間已成功填入資料庫！")

    except Exception as e:
        print(f"❌ 發生錯誤：{e}")

if __name__ == "__main__":
    sync_opening_hours()