<?php
/**
 * AMSTRONG GATE - API Sites
 * Endpoints pour la gestion des sites d'exploitation
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

// GET /api/sites - Récupérer tous les sites
if ($method === 'GET' && empty($request[0])) {
    try {
        $query = "SELECT * FROM sites ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $sites = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $sites]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// GET /api/sites/{id} - Récupérer un site spécifique
elseif ($method === 'GET' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $query = "SELECT * FROM sites WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        $site = $stmt->fetch();
        
        if (!$site) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Site non trouvé']);
            exit;
        }
        
        echo json_encode(['success' => true, 'data' => $site]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/sites - Créer un nouveau site
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "INSERT INTO sites (name, location, manager_name, status) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['name'] ?? null,
            $data['location'] ?? null,
            $data['manager_name'] ?? null,
            $data['status'] ?? 'active'
        ]);
        
        $id = $conn->lastInsertId();
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Site créé avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// PUT /api/sites/{id} - Mettre à jour un site
elseif ($method === 'PUT' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "UPDATE sites SET name = ?, location = ?, manager_name = ?, status = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['name'] ?? null,
            $data['location'] ?? null,
            $data['manager_name'] ?? null,
            $data['status'] ?? 'active',
            $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Site mis à jour avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// DELETE /api/sites/{id} - Supprimer un site
elseif ($method === 'DELETE' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        
        $query = "DELETE FROM sites WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Site supprimé avec succès']);
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
