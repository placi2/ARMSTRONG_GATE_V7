<?php
/**
 * AMSTRONG GATE - API Dépenses
 * Endpoints pour la gestion des dépenses par équipe
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

// GET /api/expenses - Récupérer toutes les dépenses
if ($method === 'GET' && empty($request[0])) {
    try {
        $query = "SELECT e.*, t.name as team_name, s.name as site_name FROM expenses e LEFT JOIN teams t ON e.team_id = t.id LEFT JOIN sites s ON t.site_id = s.id ORDER BY e.expense_date DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $expenses = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $expenses]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// GET /api/expenses/{id} - Récupérer une dépense spécifique
elseif ($method === 'GET' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $query = "SELECT e.*, t.name as team_name, s.name as site_name FROM expenses e LEFT JOIN teams t ON e.team_id = t.id LEFT JOIN sites s ON t.site_id = s.id WHERE e.id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        $expense = $stmt->fetch();
        
        if (!$expense) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Dépense non trouvée']);
            exit;
        }
        
        echo json_encode(['success' => true, 'data' => $expense]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/expenses - Créer une nouvelle dépense
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "INSERT INTO expenses (team_id, expense_date, category, description, amount, currency, notes) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['team_id'] ?? null,
            $data['expense_date'] ?? date('Y-m-d'),
            $data['category'] ?? null,
            $data['description'] ?? null,
            $data['amount'] ?? 0,
            $data['currency'] ?? 'EUR',
            $data['notes'] ?? null
        ]);
        
        $id = $conn->lastInsertId();
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Dépense créée avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// PUT /api/expenses/{id} - Mettre à jour une dépense
elseif ($method === 'PUT' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "UPDATE expenses SET team_id = ?, expense_date = ?, category = ?, description = ?, amount = ?, currency = ?, notes = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['team_id'] ?? null,
            $data['expense_date'] ?? date('Y-m-d'),
            $data['category'] ?? null,
            $data['description'] ?? null,
            $data['amount'] ?? 0,
            $data['currency'] ?? 'EUR',
            $data['notes'] ?? null,
            $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Dépense mise à jour avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// DELETE /api/expenses/{id} - Supprimer une dépense
elseif ($method === 'DELETE' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        
        $query = "DELETE FROM expenses WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Dépense supprimée avec succès']);
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
