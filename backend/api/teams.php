<?php
/**
 * AMSTRONG GATE - API Équipes
 * Endpoints pour la gestion des équipes
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

// GET /api/teams - Récupérer toutes les équipes
if ($method === 'GET' && empty($request[0])) {
    try {
        $query = "SELECT t.*, s.name as site_name FROM teams t LEFT JOIN sites s ON t.site_id = s.id ORDER BY t.created_date DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $teams = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $teams]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// GET /api/teams/{id} - Récupérer une équipe spécifique
elseif ($method === 'GET' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $query = "SELECT t.*, s.name as site_name FROM teams t LEFT JOIN sites s ON t.site_id = s.id WHERE t.id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        $team = $stmt->fetch();
        
        if (!$team) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Équipe non trouvée']);
            exit;
        }
        
        echo json_encode(['success' => true, 'data' => $team]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/teams - Créer une nouvelle équipe
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "INSERT INTO teams (site_id, name, manager_name, created_date, status) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['site_id'] ?? null,
            $data['name'] ?? null,
            $data['manager_name'] ?? null,
            $data['created_date'] ?? date('Y-m-d'),
            $data['status'] ?? 'active'
        ]);
        
        $id = $conn->lastInsertId();
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Équipe créée avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// PUT /api/teams/{id} - Mettre à jour une équipe
elseif ($method === 'PUT' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "UPDATE teams SET site_id = ?, name = ?, manager_name = ?, created_date = ?, status = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['site_id'] ?? null,
            $data['name'] ?? null,
            $data['manager_name'] ?? null,
            $data['created_date'] ?? date('Y-m-d'),
            $data['status'] ?? 'active',
            $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Équipe mise à jour avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// DELETE /api/teams/{id} - Supprimer une équipe
elseif ($method === 'DELETE' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        
        $query = "DELETE FROM teams WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Équipe supprimée avec succès']);
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
