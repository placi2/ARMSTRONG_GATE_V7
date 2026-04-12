<?php
/**
 * AMSTRONG GATE - API Employés
 * Endpoints pour la gestion des employés
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

// GET /api/employees - Récupérer tous les employés
if ($method === 'GET' && empty($request[0])) {
    try {
        $query = "SELECT e.*, t.name as team_name, s.name as site_name FROM employees e LEFT JOIN teams t ON e.team_id = t.id LEFT JOIN sites s ON t.site_id = s.id ORDER BY e.name";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $employees = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $employees]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// GET /api/employees/{id} - Récupérer un employé spécifique
elseif ($method === 'GET' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $query = "SELECT e.*, t.name as team_name, s.name as site_name FROM employees e LEFT JOIN teams t ON e.team_id = t.id LEFT JOIN sites s ON t.site_id = s.id WHERE e.id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        $employee = $stmt->fetch();
        
        if (!$employee) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Employé non trouvé']);
            exit;
        }
        
        echo json_encode(['success' => true, 'data' => $employee]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/employees - Créer un nouvel employé
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "INSERT INTO employees (team_id, name, function, monthly_salary, role, status) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['team_id'] ?? null,
            $data['name'] ?? null,
            $data['function'] ?? null,
            $data['monthly_salary'] ?? 0,
            $data['role'] ?? 'employee',
            $data['status'] ?? 'active'
        ]);
        
        $id = $conn->lastInsertId();
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Employé créé avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// PUT /api/employees/{id} - Mettre à jour un employé
elseif ($method === 'PUT' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "UPDATE employees SET team_id = ?, name = ?, function = ?, monthly_salary = ?, role = ?, status = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            $data['team_id'] ?? null,
            $data['name'] ?? null,
            $data['function'] ?? null,
            $data['monthly_salary'] ?? 0,
            $data['role'] ?? 'employee',
            $data['status'] ?? 'active',
            $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Employé mis à jour avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// DELETE /api/employees/{id} - Supprimer un employé
elseif ($method === 'DELETE' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        
        $query = "DELETE FROM employees WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Employé supprimé avec succès']);
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
