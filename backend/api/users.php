<?php
/**
 * AMSTRONG GATE - API Utilisateurs
 * Endpoints pour la gestion des utilisateurs avec leurs rôles
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

session_start();

// Fonction pour vérifier l'authentification
function checkAuth() {
    if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Non authentifié']);
        exit;
    }
}

// Fonction pour vérifier les permissions Admin
function checkAdminRole() {
    if ($_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Accès refusé - Admin requis']);
        exit;
    }
}

// GET /api/users - Récupérer tous les utilisateurs (Admin uniquement)
if ($method === 'GET' && empty($request[0])) {
    try {
        checkAuth();
        checkAdminRole();
        
        $query = "SELECT id, email, name, role, status, created_at, updated_at FROM users ORDER BY name";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $users]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// GET /api/users/{id} - Récupérer un utilisateur spécifique
elseif ($method === 'GET' && !empty($request[0])) {
    try {
        checkAuth();
        
        $id = intval($request[0]);
        
        // Les utilisateurs peuvent voir leur propre profil, les admins peuvent voir tous les profils
        if ($id !== $_SESSION['user_id'] && $_SESSION['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Accès refusé']);
            exit;
        }
        
        $query = "SELECT id, email, name, role, status, created_at, updated_at FROM users WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Utilisateur non trouvé']);
            exit;
        }
        
        echo json_encode(['success' => true, 'data' => $user]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/users - Créer un nouvel utilisateur (Admin uniquement)
elseif ($method === 'POST') {
    try {
        checkAuth();
        checkAdminRole();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;
        $name = $data['name'] ?? null;
        $role = $data['role'] ?? 'employee';
        
        if (!$email || !$password || !$name) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Email, mot de passe et nom requis']);
            exit;
        }
        
        // Valider le rôle
        if (!in_array($role, ['admin', 'manager', 'employee'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Rôle invalide']);
            exit;
        }
        
        // Vérifier que l'email n'existe pas
        $checkQuery = "SELECT id FROM users WHERE email = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->execute([$email]);
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Email déjà utilisé']);
            exit;
        }
        
        // Hasher le mot de passe
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        
        // Créer l'utilisateur
        $query = "INSERT INTO users (email, password_hash, name, role, status) VALUES (?, ?, ?, ?, 'active')";
        $stmt = $conn->prepare($query);
        $stmt->execute([$email, $passwordHash, $name, $role]);
        
        $id = $conn->lastInsertId();
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Utilisateur créé avec succès']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// PUT /api/users/{id} - Mettre à jour un utilisateur
elseif ($method === 'PUT' && !empty($request[0])) {
    try {
        checkAuth();
        
        $id = intval($request[0]);
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Les utilisateurs peuvent modifier leur propre profil, les admins peuvent modifier tous les profils
        if ($id !== $_SESSION['user_id'] && $_SESSION['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Accès refusé']);
            exit;
        }
        
        // Les admins peuvent changer le rôle et le statut, les utilisateurs non
        $name = $data['name'] ?? null;
        $role = $_SESSION['role'] === 'admin' ? ($data['role'] ?? null) : null;
        $status = $_SESSION['role'] === 'admin' ? ($data['status'] ?? null) : null;
        
        if ($role && !in_array($role, ['admin', 'manager', 'employee'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Rôle invalide']);
            exit;
        }
        
        if ($status && !in_array($status, ['active', 'inactive'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Statut invalide']);
            exit;
        }
        
        // Construire la requête dynamiquement
        $updates = [];
        $params = [];
        
        if ($name) {
            $updates[] = "name = ?";
            $params[] = $name;
        }
        if ($role) {
            $updates[] = "role = ?";
            $params[] = $role;
        }
        if ($status) {
            $updates[] = "status = ?";
            $params[] = $status;
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Aucune donnée à mettre à jour']);
            exit;
        }
        
        $params[] = $id;
        $query = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Utilisateur mis à jour avec succès']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// DELETE /api/users/{id} - Supprimer un utilisateur (Admin uniquement)
elseif ($method === 'DELETE' && !empty($request[0])) {
    try {
        checkAuth();
        checkAdminRole();
        
        $id = intval($request[0]);
        
        // Empêcher de supprimer le dernier admin
        if ($id === $_SESSION['user_id']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Impossible de supprimer votre propre compte']);
            exit;
        }
        
        $query = "DELETE FROM users WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Utilisateur supprimé avec succès']);
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
