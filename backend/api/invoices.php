<?php
/**
 * AMSTRONG GATE - API Factures
 * Endpoints pour la gestion des factures avec statut et calcul du reste dû
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

// GET /api/invoices - Récupérer toutes les factures
if ($method === 'GET' && empty($request[0])) {
    try {
        $query = "SELECT i.*, t.name as team_name, 
                  COALESCE(SUM(p.amount), 0) as paid_amount,
                  (i.total_amount - COALESCE(SUM(p.amount), 0)) as remaining_amount
                  FROM invoices i 
                  LEFT JOIN teams t ON i.team_id = t.id
                  LEFT JOIN invoice_payments p ON i.id = p.invoice_id
                  GROUP BY i.id
                  ORDER BY i.invoice_date DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $invoices = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $invoices]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// GET /api/invoices/{id} - Récupérer une facture spécifique
elseif ($method === 'GET' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $query = "SELECT i.*, t.name as team_name,
                  COALESCE(SUM(p.amount), 0) as paid_amount,
                  (i.total_amount - COALESCE(SUM(p.amount), 0)) as remaining_amount
                  FROM invoices i 
                  LEFT JOIN teams t ON i.team_id = t.id
                  LEFT JOIN invoice_payments p ON i.id = p.invoice_id
                  WHERE i.id = ?
                  GROUP BY i.id";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        $invoice = $stmt->fetch();
        
        if (!$invoice) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Facture non trouvée']);
            exit;
        }
        
        // Récupérer les paiements associés
        $paymentsQuery = "SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY payment_date DESC";
        $paymentsStmt = $conn->prepare($paymentsQuery);
        $paymentsStmt->execute([$id]);
        $payments = $paymentsStmt->fetchAll();
        
        $invoice['payments'] = $payments;
        
        echo json_encode(['success' => true, 'data' => $invoice]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/invoices - Créer une nouvelle facture
elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $invoiceNumber = $data['invoice_number'] ?? null;
        $invoiceDate = $data['invoice_date'] ?? date('Y-m-d');
        $teamId = $data['team_id'] ?? null;
        $totalAmount = $data['total_amount'] ?? 0;
        $status = $data['status'] ?? 'draft';
        $notes = $data['notes'] ?? null;
        
        if (!$invoiceNumber) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Numéro de facture requis']);
            exit;
        }
        
        // Vérifier que le numéro n'existe pas
        $checkQuery = "SELECT id FROM invoices WHERE invoice_number = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->execute([$invoiceNumber]);
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Numéro de facture déjà utilisé']);
            exit;
        }
        
        $query = "INSERT INTO invoices (invoice_number, invoice_date, team_id, total_amount, status, notes) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->execute([$invoiceNumber, $invoiceDate, $teamId, $totalAmount, $status, $notes]);
        
        $id = $conn->lastInsertId();
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Facture créée avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// PUT /api/invoices/{id} - Mettre à jour une facture
elseif ($method === 'PUT' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        $data = json_decode(file_get_contents('php://input'), true);
        
        $invoiceDate = $data['invoice_date'] ?? null;
        $teamId = $data['team_id'] ?? null;
        $totalAmount = $data['total_amount'] ?? null;
        $status = $data['status'] ?? null;
        $notes = $data['notes'] ?? null;
        
        $updates = [];
        $params = [];
        
        if ($invoiceDate) {
            $updates[] = "invoice_date = ?";
            $params[] = $invoiceDate;
        }
        if ($teamId !== null) {
            $updates[] = "team_id = ?";
            $params[] = $teamId;
        }
        if ($totalAmount !== null) {
            $updates[] = "total_amount = ?";
            $params[] = $totalAmount;
        }
        if ($status) {
            $updates[] = "status = ?";
            $params[] = $status;
        }
        if ($notes !== null) {
            $updates[] = "notes = ?";
            $params[] = $notes;
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Aucune donnée à mettre à jour']);
            exit;
        }
        
        $params[] = $id;
        $query = "UPDATE invoices SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Facture mise à jour avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// DELETE /api/invoices/{id} - Supprimer une facture
elseif ($method === 'DELETE' && !empty($request[0])) {
    try {
        $id = intval($request[0]);
        
        // Supprimer les paiements associés
        $deletePaymentsQuery = "DELETE FROM invoice_payments WHERE invoice_id = ?";
        $deletePaymentsStmt = $conn->prepare($deletePaymentsQuery);
        $deletePaymentsStmt->execute([$id]);
        
        // Supprimer la facture
        $query = "DELETE FROM invoices WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Facture supprimée avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// POST /api/invoices/{id}/payment - Enregistrer un paiement
elseif ($method === 'POST' && !empty($request[0]) && $request[1] === 'payment') {
    try {
        $invoiceId = intval($request[0]);
        $data = json_decode(file_get_contents('php://input'), true);
        
        $amount = $data['amount'] ?? null;
        $paymentDate = $data['payment_date'] ?? date('Y-m-d');
        $paymentMethod = $data['payment_method'] ?? null;
        $reference = $data['reference'] ?? null;
        
        if (!$amount || $amount <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Montant invalide']);
            exit;
        }
        
        // Vérifier que la facture existe
        $invoiceQuery = "SELECT * FROM invoices WHERE id = ?";
        $invoiceStmt = $conn->prepare($invoiceQuery);
        $invoiceStmt->execute([$invoiceId]);
        $invoice = $invoiceStmt->fetch();
        
        if (!$invoice) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Facture non trouvée']);
            exit;
        }
        
        // Vérifier que le montant ne dépasse pas le reste dû
        $paidQuery = "SELECT COALESCE(SUM(amount), 0) as paid FROM invoice_payments WHERE invoice_id = ?";
        $paidStmt = $conn->prepare($paidQuery);
        $paidStmt->execute([$invoiceId]);
        $paid = $paidStmt->fetch();
        $remaining = $invoice['total_amount'] - $paid['paid'];
        
        if ($amount > $remaining) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Le montant dépasse le reste dû']);
            exit;
        }
        
        // Créer le paiement
        $query = "INSERT INTO invoice_payments (invoice_id, payment_date, amount, payment_method, reference) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->execute([$invoiceId, $paymentDate, $amount, $paymentMethod, $reference]);
        
        $paymentId = $conn->lastInsertId();
        
        // Mettre à jour le statut de la facture si complètement payée
        $newRemaining = $remaining - $amount;
        if ($newRemaining <= 0) {
            $updateQuery = "UPDATE invoices SET status = 'paid' WHERE id = ?";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->execute([$invoiceId]);
        } elseif ($paid['paid'] == 0) {
            // Première fois qu'on paie
            $updateQuery = "UPDATE invoices SET status = 'partially_paid' WHERE id = ?";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->execute([$invoiceId]);
        }
        
        echo json_encode(['success' => true, 'id' => $paymentId, 'message' => 'Paiement enregistré avec succès']);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// DELETE /api/invoices/{id}/payment/{paymentId} - Supprimer un paiement
elseif ($method === 'DELETE' && !empty($request[0]) && !empty($request[2])) {
    try {
        $invoiceId = intval($request[0]);
        $paymentId = intval($request[2]);
        
        // Supprimer le paiement
        $query = "DELETE FROM invoice_payments WHERE id = ? AND invoice_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->execute([$paymentId, $invoiceId]);
        
        // Recalculer le statut de la facture
        $invoiceQuery = "SELECT * FROM invoices WHERE id = ?";
        $invoiceStmt = $conn->prepare($invoiceQuery);
        $invoiceStmt->execute([$invoiceId]);
        $invoice = $invoiceStmt->fetch();
        
        $paidQuery = "SELECT COALESCE(SUM(amount), 0) as paid FROM invoice_payments WHERE invoice_id = ?";
        $paidStmt = $conn->prepare($paidQuery);
        $paidStmt->execute([$invoiceId]);
        $paid = $paidStmt->fetch();
        
        if ($paid['paid'] == 0) {
            $newStatus = 'issued';
        } elseif ($paid['paid'] < $invoice['total_amount']) {
            $newStatus = 'partially_paid';
        } else {
            $newStatus = 'paid';
        }
        
        $updateQuery = "UPDATE invoices SET status = ? WHERE id = ?";
        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->execute([$newStatus, $invoiceId]);
        
        echo json_encode(['success' => true, 'message' => 'Paiement supprimé avec succès']);
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
