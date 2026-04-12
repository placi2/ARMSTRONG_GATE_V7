<?php
/**
 * AMSTRONG GATE - API Caisse
 * Endpoints pour la gestion des mouvements de caisse (entrées/sorties)
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

// GET /api/cash - Récupérer tous les mouvements de caisse
if ($method === 'GET' && empty($request[0])) {
    try {
        $query = "SELECT * FROM cash_movements ORDER BY movement_date DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $movements = $stmt->fetchAll();
        
        // Calculer le solde total
        $totalQuery = "SELECT COALESCE(SUM(CASE WHEN movement_type = 'income' THEN amount ELSE -amount END), 0) as balance FROM cash_movements";
        $totalStmt = $conn->prepare($totalQuery);
        $totalStmt->execute();
        $balance = $totalStmt->fetch();
        
        echo json_encode(['success' => true, 'data' => $movements, 'balance' => $balance['balance']]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// GET /api/cash/{id} - Récupérer un mouvement spécifique
elseif ($method === 'GET' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $query = "SELECT * FROM cash_movements WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        $movement = $stmt->fetch();
        
        if (!$movement) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Mouvement non trouvé']);
            exit;
        }
        
        echo json_encode(['success' => true, 'data' => $movement]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/cash - Créer un nouveau mouvement de caisse
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Valider le type de mouvement
        $movementType = $data['movement_type'] ?? 'income';
        if (!in_array($movementType, ['income', 'expense'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Type de mouvement invalide (income ou expense)']);
            exit;
        }
        
        $query = "INSERT INTO cash_movements (movement_date, movement_type, category, description, amount, currency, reference, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['movement_date'] ?? date('Y-m-d'),
            $movementType,
            $data['category'] ?? null,
            $data['description'] ?? null,
            $data['amount'] ?? 0,
            $data['currency'] ?? 'EUR',
            $data['reference'] ?? null,
            $data['notes'] ?? null
        ]);
        
        $id = $conn->lastInsertId();
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Mouvement de caisse créé avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// PUT /api/cash/{id} - Mettre à jour un mouvement
elseif ($method === 'PUT' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Valider le type de mouvement
        $movementType = $data['movement_type'] ?? 'income';
        if (!in_array($movementType, ['income', 'expense'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Type de mouvement invalide (income ou expense)']);
            exit;
        }
        
        $query = "UPDATE cash_movements SET movement_date = ?, movement_type = ?, category = ?, description = ?, amount = ?, currency = ?, reference = ?, notes = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['movement_date'] ?? date('Y-m-d'),
            $movementType,
            $data['category'] ?? null,
            $data['description'] ?? null,
            $data['amount'] ?? 0,
            $data['currency'] ?? 'EUR',
            $data['reference'] ?? null,
            $data['notes'] ?? null,
            $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Mouvement mis à jour avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// DELETE /api/cash/{id} - Supprimer un mouvement
elseif ($method === 'DELETE' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        
        $query = "DELETE FROM cash_movements WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Mouvement supprimé avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// GET /api/cash/summary - Récupérer un résumé de caisse
elseif ($method === 'GET' && $request[0] === 'summary') {
    try {
        $query = "SELECT 
                    COALESCE(SUM(CASE WHEN movement_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                    COALESCE(SUM(CASE WHEN movement_type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
                    COALESCE(SUM(CASE WHEN movement_type = 'income' THEN amount ELSE -amount END), 0) as balance
                  FROM cash_movements";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $summary = $stmt->fetch();
        
        echo json_encode(['success' => true, 'data' => $summary]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
}

$database->disconnect();
?>
