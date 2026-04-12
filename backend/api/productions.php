<?php
/**
 * AMSTRONG GATE - API Productions
 * Endpoints pour la gestion des productions d'or
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

// GET /api/productions - Récupérer toutes les productions
if ($method === 'GET' && empty($request[0])) {
    try {
        $query = "SELECT p.*, t.name as team_name, e.name as employee_name FROM productions p LEFT JOIN teams t ON p.team_id = t.id LEFT JOIN employees e ON p.employee_id = e.id ORDER BY p.production_date DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $productions = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $productions]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/productions - Créer une nouvelle production
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "INSERT INTO productions (team_id, employee_id, production_date, weight_grams, purity_percentage, price_per_gram, estimated_value, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['team_id'] ?? null,
            $data['employee_id'] ?? null,
            $data['production_date'] ?? date('Y-m-d'),
            $data['weight_grams'] ?? 0,
            $data['purity_percentage'] ?? 100,
            $data['price_per_gram'] ?? 0,
            $data['estimated_value'] ?? 0,
            $data['notes'] ?? null
        ]);
        
        $id = $conn->lastInsertId();
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Production créée avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// DELETE /api/productions/{id} - Supprimer une production
elseif ($method === 'DELETE' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        
        $query = "DELETE FROM productions WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Production supprimée avec succès']);
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
