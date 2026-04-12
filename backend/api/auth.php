<?php
/**
 * AMSTRONG GATE - API Authentification
 * Endpoints pour la gestion de la connexion, déconnexion et sessions
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/Database.php';

$database = new Database();
$conn = $database->connect();
$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));

// Démarrer la session
session_start();

// POST /api/auth/login - Connexion utilisateur
if ($method === 'POST' && $request[0] === 'login') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;
        
        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Email et mot de passe requis']);
            exit;
        }
        
        // Rechercher l'utilisateur
        $query = "SELECT * FROM users WHERE email = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Email ou mot de passe incorrect']);
            exit;
        }
        
        // Vérifier le mot de passe
        if (!password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Email ou mot de passe incorrect']);
            exit;
        }
        
        // Vérifier le statut
        if ($user['status'] !== 'active') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Compte inactif']);
            exit;
        }
        
        // Créer la session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['logged_in'] = true;
        
        // Générer un token simple (dans une vraie app, utiliser JWT)
        $token = bin2hex(random_bytes(32));
        $_SESSION['token'] = $token;
        
        echo json_encode([
            'success' => true,
            'message' => 'Connexion réussie',
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role']
            ],
            'token' => $token
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/auth/logout - Déconnexion
elseif ($method === 'POST' && $request[0] === 'logout') {
    try {
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Déconnexion réussie']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// GET /api/auth/me - Récupérer l'utilisateur actuel
elseif ($method === 'GET' && $request[0] === 'me') {
    try {
        if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Non authentifié']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'email' => $_SESSION['email'],
                'name' => $_SESSION['name'],
                'role' => $_SESSION['role']
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/auth/register - Créer un nouvel utilisateur (Admin uniquement)
elseif ($method === 'POST' && $request[0] === 'register') {
    try {
        // Vérifier l'authentification
        if (!isset($_SESSION['logged_in']) || $_SESSION['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Accès refusé']);
            exit;
        }
        
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

// PUT /api/auth/change-password - Changer le mot de passe
elseif ($method === 'PUT' && $request[0] === 'change-password') {
    try {
        if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Non authentifié']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $currentPassword = $data['current_password'] ?? null;
        $newPassword = $data['new_password'] ?? null;
        
        if (!$currentPassword || !$newPassword) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Ancien et nouveau mot de passe requis']);
            exit;
        }
        
        // Récupérer l'utilisateur
        $query = "SELECT * FROM users WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        
        // Vérifier l'ancien mot de passe
        if (!password_verify($currentPassword, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Mot de passe actuel incorrect']);
            exit;
        }
        
        // Hasher le nouveau mot de passe
        $newPasswordHash = password_hash($newPassword, PASSWORD_BCRYPT);
        
        // Mettre à jour
        $updateQuery = "UPDATE users SET password_hash = ? WHERE id = ?";
        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->execute([$newPasswordHash, $_SESSION['user_id']]);
        
        echo json_encode(['success' => true, 'message' => 'Mot de passe changé avec succès']);
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
