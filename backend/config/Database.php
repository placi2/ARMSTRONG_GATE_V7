<?php
/**
 * AMSTRONG GATE - Classe de connexion à la base de données
 * Gestion de la connexion MySQL avec PDO
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'amstrong_gate';
    private $user = 'root';
    private $password = '';
    private $conn;

    /**
     * Connexion à la base de données
     */
    public function connect() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                'mysql:host=' . $this->host . ';dbname=' . $this->db_name . ';charset=utf8mb4',
                $this->user,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]
            );
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Erreur de connexion: ' . $e->getMessage()]);
            exit;
        }

        return $this->conn;
    }

    /**
     * Obtenir la connexion existante
     */
    public function getConnection() {
        if ($this->conn === null) {
            $this->connect();
        }
        return $this->conn;
    }

    /**
     * Fermer la connexion
     */
    public function disconnect() {
        $this->conn = null;
    }
}
?>
