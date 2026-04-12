<?php
/**
 * AMSTRONG GATE - API Avances sur Salaires
 * Endpoints pour la gestion des avances sur salaires des employés
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

// GET /api/advances - Récupérer toutes les avances
if ($method === 'GET' && empty($request[0])) {
    try {
        $query = "SELECT a.*, e.name as employee_name, t.name as team_name FROM salary_advances a LEFT JOIN employees e ON a.employee_id = e.id LEFT JOIN teams t ON e.team_id = t.id ORDER BY a.advance_date DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $advances = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $advances]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// GET /api/advances/{id} - Récupérer une avance spécifique
elseif ($method === 'GET' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $query = "SELECT a.*, e.name as employee_name, t.name as team_name FROM salary_advances a LEFT JOIN employees e ON a.employee_id = e.id LEFT JOIN teams t ON e.team_id = t.id WHERE a.id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        $advance = $stmt->fetch();
        
        if (!$advance) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Avance non trouvée']);
            exit;
        }
        
        echo json_encode(['success' => true, 'data' => $advance]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/advances - Créer une nouvelle avance
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "INSERT INTO salary_advances (employee_id, advance_date, amount, currency, reason, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['employee_id'] ?? null,
            $data['advance_date'] ?? date('Y-m-d'),
            $data['amount'] ?? 0,
            $data['currency'] ?? 'EUR',
            $data['reason'] ?? null,
            $data['status'] ?? 'pending',
            $data['notes'] ?? null
        ]);
        
        $id = $conn->lastInsertId();
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Avance créée avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// PUT /api/advances/{id} - Mettre à jour une avance
elseif ($method === 'PUT' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "UPDATE salary_advances SET employee_id = ?, advance_date = ?, amount = ?, currency = ?, reason = ?, status = ?, notes = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['employee_id'] ?? null,
            $data['advance_date'] ?? date('Y-m-d'),
            $data['amount'] ?? 0,
            $data['currency'] ?? 'EUR',
            $data['reason'] ?? null,
            $data['status'] ?? 'pending',
            $data['notes'] ?? null,
            $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Avance mise à jour avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// DELETE /api/advances/{id} - Supprimer une avance
elseif ($method === 'DELETE' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        
        $query = "DELETE FROM salary_advances WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Avance supprimée avec succès']);
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
