<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 簡單的記憶體資料庫模擬（實際應使用真實資料庫）
class CafeDatabase {
    private static $cafes = [
        [
            'id' => 1,
            'name' => '晨曦咖啡',
            'address' => '板橋區重慶路100號',
            'lat' => 25.0119,
            'lon' => 121.4637,
            'hours' => '07:00-21:00',
            'phone' => '02-1234-5678',
            'tags' => ['安靜', '插座', '免費WiFi'],
            'menu' => ['美式咖啡', '拿鐵', '卡布奇諾']
        ],
        [
            'id' => 2,
            'name' => '素食天堂咖啡',
            'address' => '板橋區南雅南路50號',
            'lat' => 25.0089,
            'lon' => 121.4650,
            'hours' => '08:00-18:00',
            'phone' => '02-8765-4321',
            'tags' => ['素食', '插座'],
            'menu' => ['黑咖啡', '素食麵包']
        ],
        [
            'id' => 3,
            'name' => '繁華咖啡廳',
            'address' => '板橋區新北大道200號',
            'lat' => 25.0150,
            'lon' => 121.4620,
            'hours' => '09:00-22:00',
            'phone' => '02-9999-8888',
            'tags' => ['熱鬧', '人多'],
            'menu' => ['冰咖啡', '特調飲品']
        ]
    ];

    private static $users = [];
    private static $nextUserId = 1;

    public static function getAllCafes() {
        return self::$cafes;
    }

    public static function searchCafes($keyword, $tags = []) {
        $results = array_filter(self::$cafes, function($cafe) use ($keyword, $tags) {
            $nameMatch = stripos($cafe['name'], $keyword) !== false;
            $addressMatch = stripos($cafe['address'], $keyword) !== false;
            
            if (empty($tags)) {
                return $nameMatch || $addressMatch;
            }
            
            $hasAllTags = true;
            foreach ($tags as $tag) {
                if (!in_array($tag, $cafe['tags'])) {
                    $hasAllTags = false;
                    break;
                }
            }
            
            return ($nameMatch || $addressMatch) && $hasAllTags;
        });

        return array_values($results);
    }

    public static function getCafeById($id) {
        foreach (self::$cafes as $cafe) {
            if ($cafe['id'] == $id) {
                return $cafe;
            }
        }
        return null;
    }

    public static function registerUser($email, $password, $role = 'user') {
        // 檢查郵箱是否已存在
        foreach (self::$users as $user) {
            if ($user['email'] === $email) {
                return ['success' => false, 'error' => '郵箱已被註冊'];
            }
        }

        $user = [
            'id' => self::$nextUserId++,
            'email' => $email,
            'password' => password_hash($password, PASSWORD_BCRYPT),
            'role' => $role,
            'created_at' => date('Y-m-d H:i:s')
        ];

        self::$users[] = $user;
        return ['success' => true, 'user_id' => $user['id'], 'role' => $user['role']];
    }

    public static function loginUser($email, $password) {
        foreach (self::$users as $user) {
            if ($user['email'] === $email && password_verify($password, $user['password'])) {
                return ['success' => true, 'user_id' => $user['id'], 'role' => $user['role']];
            }
        }
        return ['success' => false, 'error' => '郵箱或密碼錯誤'];
    }

    public static function getAllUsers() {
        return self::$users;
    }

    public static function addCafe($data) {
        $cafe = [
            'id' => count(self::$cafes) + 1,
            'name' => $data['name'],
            'address' => $data['address'],
            'lat' => $data['lat'],
            'lon' => $data['lon'],
            'hours' => $data['hours'] ?? '09:00-18:00',
            'phone' => $data['phone'] ?? '',
            'tags' => $data['tags'] ?? [],
            'menu' => $data['menu'] ?? []
        ];
        self::$cafes[] = $cafe;
        return ['success' => true, 'cafe' => $cafe];
    }
}

// 路由處理
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 提取端點
$endpoint = basename($path);
if ($endpoint === 'api.php' && isset($_GET['action'])) {
    $endpoint = $_GET['action'];
}

// 路由邏輯
switch ($endpoint) {
    case 'api.php':
        if ($method === 'GET') {
            echo json_encode(CafeDatabase::getAllCafes());
        }
        break;

    case 'search':
        if ($method === 'GET') {
            $keyword = $_GET['keyword'] ?? '';
            $tags = isset($_GET['tags']) ? explode(',', $_GET['tags']) : [];
            $results = CafeDatabase::searchCafes($keyword, $tags);
            echo json_encode(['success' => true, 'results' => $results]);
        }
        break;

    case 'cafe':
        if ($method === 'GET') {
            $id = $_GET['id'] ?? null;
            if ($id) {
                $cafe = CafeDatabase::getCafeById($id);
                echo json_encode(['success' => true, 'cafe' => $cafe]);
            }
        } elseif ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $result = CafeDatabase::addCafe($data);
            echo json_encode($result);
        }
        break;

    case 'register':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            $role = $data['role'] ?? 'user';

            if (empty($email) || empty($password)) {
                echo json_encode(['success' => false, 'error' => '郵箱和密碼不能為空']);
            } else {
                $result = CafeDatabase::registerUser($email, $password, $role);
                echo json_encode($result);
            }
        }
        break;

    case 'login':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';

            if (empty($email) || empty($password)) {
                echo json_encode(['success' => false, 'error' => '郵箱和密碼不能為空']);
            } else {
                $result = CafeDatabase::loginUser($email, $password);
                echo json_encode($result);
            }
        }
        break;

    case 'users':
        if ($method === 'GET') {
            echo json_encode(['success' => true, 'users' => CafeDatabase::getAllUsers()]);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => '端點不存在']);
}
?>
