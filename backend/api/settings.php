<?php
/**
 * AMSTRONG GATE - API Paramètres
 * Endpoints pour la gestion des paramètres de l'application
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/Database.php';

$database = new Database();
$conn = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));

// GET /api/settings - Récupérer tous les paramètres
if ($method === 'GET' && empty($request[0])) {
    try {
        $query = "SELECT * FROM settings";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $settings = $stmt->fetchAll();
        
        // Convertir en objet clé-valeur
        $settingsArray = [];
        foreach ($settings as $setting) {
            $value = $setting['setting_value'];
            if ($setting['data_type'] === 'number') {
                $value = floatval($value);
            } elseif ($setting['data_type'] === 'boolean') {
                $value = $value === 'true' || $value === '1';
            } elseif ($setting['data_type'] === 'json') {
                $value = json_decode($value, true);
            }
            $settingsArray[$setting['setting_key']] = $value;
        }
        
        echo json_encode(['success' => true, 'data' => $settingsArray]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// GET /api/settings/{key} - Récupérer un paramètre spécifique
elseif ($method === 'GET' && !empty($request[0])) {
    try {
        $key = $request[0];
        $query = "SELECT * FROM settings WHERE setting_key = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$key]);
        $setting = $stmt->fetch();
        
        if (!$setting) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Paramètre non trouvé']);
            exit;
        }
        
        $value = $setting['setting_value'];
        if ($setting['data_type'] === 'number') {
            $value = floatval($value);
        } elseif ($setting['data_type'] === 'boolean') {
            $value = $value === 'true' || $value === '1';
        } elseif ($setting['data_type'] === 'json') {
            $value = json_decode($value, true);
        }
        
        echo json_encode(['success' => true, 'data' => ['key' => $key, 'value' => $value]]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/settings - Créer un nouveau paramètre
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $value = $data['value'] ?? null;
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value);
            $dataType = 'json';
        } elseif (is_bool($value)) {
            $value = $value ? 'true' : 'false';
            $dataType = 'boolean';
        } elseif (is_numeric($value)) {
            $dataType = 'number';
        } else {
            $dataType = 'string';
        }
        
        $query = "INSERT INTO settings (setting_key, setting_value, description, data_type) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, data_type = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['key'] ?? null,
            $value,
            $data['description'] ?? null,
            $dataType,
            $value,
            $dataType
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Paramètre créé/mis à jour avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// PUT /api/settings/{key} - Mettre à jour un paramètre
elseif ($method === 'PUT' && !empty($request[0])) {
    try {
        $key = $request[0];
        $data = json_decode(file_get_contents('php://input'), true);
        
        $value = $data['value'] ?? null;
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value);
            $dataType = 'json';
        } elseif (is_bool($value)) {
            $value = $value ? 'true' : 'false';
            $dataType = 'boolean';
        } elseif (is_numeric($value)) {
            $dataType = 'number';
        } else {
            $dataType = 'string';
        }
        
        $query = "UPDATE settings SET setting_value = ?, data_type = ? WHERE setting_key = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$value, $dataType, $key]);
        
        echo json_encode(['success' => true, 'message' => 'Paramètre mis à jour avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
}

$database->disconnect();
?>
