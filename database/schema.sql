-- ============================================================================
-- AMSTRONG GATE - Schéma de Base de Données MySQL
-- Application de Gestion d'Exploitation Aurifère
-- ============================================================================

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS amstrong_gate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE amstrong_gate;

-- ============================================================================
-- TABLE: users (Utilisateurs et authentification)
-- ============================================================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'employee') NOT NULL DEFAULT 'employee',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: settings (Paramètres de l'application)
-- ============================================================================
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value LONGTEXT NOT NULL,
  description VARCHAR(500),
  data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: sites (Sites d'exploitation)
-- ============================================================================
CREATE TABLE sites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(500),
  manager_name VARCHAR(255),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: teams (Équipes)
-- ============================================================================
CREATE TABLE teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  site_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  manager_name VARCHAR(255),
  created_date DATE,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  INDEX idx_site_id (site_id),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: employees (Employés)
-- ============================================================================
CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  function VARCHAR(255),
  monthly_salary DECIMAL(10, 2),
  role ENUM('employee', 'manager') DEFAULT 'employee',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_team_id (team_id),
  INDEX idx_name (name),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: productions (Enregistrements de production d'or)
-- ============================================================================
CREATE TABLE productions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  employee_id INT,
  production_date DATE NOT NULL,
  weight_grams DECIMAL(10, 2) NOT NULL,
  purity_percentage DECIMAL(5, 2) DEFAULT 100,
  price_per_gram DECIMAL(10, 2),
  estimated_value DECIMAL(15, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_team_id (team_id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_date (production_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: expenses (Dépenses)
-- ============================================================================
CREATE TABLE expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT,
  expense_date DATE NOT NULL,
  category VARCHAR(255) NOT NULL,
  description VARCHAR(500),
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  INDEX idx_team_id (team_id),
  INDEX idx_category (category),
  INDEX idx_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: salary_advances (Avances sur salaires)
-- ============================================================================
CREATE TABLE salary_advances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  advance_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  reason VARCHAR(500),
  status ENUM('pending', 'approved', 'paid') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_employee_id (employee_id),
  INDEX idx_date (advance_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: cash_movements (Mouvements de caisse)
-- ============================================================================
CREATE TABLE cash_movements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  site_id INT NOT NULL,
  movement_date DATE NOT NULL,
  movement_type ENUM('income', 'expense') NOT NULL,
  category VARCHAR(255),
  description VARCHAR(500),
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  INDEX idx_site_id (site_id),
  INDEX idx_date (movement_date),
  INDEX idx_type (movement_type),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: invoices (Factures)
-- ============================================================================
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  team_id INT,
  total_amount DECIMAL(15, 2),
  status ENUM('draft', 'issued', 'partially_paid', 'paid', 'cancelled') DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  INDEX idx_number (invoice_number),
  INDEX idx_date (invoice_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: invoice_payments (Paiements de factures)
-- ============================================================================
CREATE TABLE invoice_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(255),
  reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: favorites (Favoris des utilisateurs)
-- ============================================================================
CREATE TABLE favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  favorite_type ENUM('employee', 'team') NOT NULL,
  favorite_id INT NOT NULL,
  favorite_name VARCHAR(255),
  notes TEXT,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (favorite_type),
  UNIQUE KEY unique_favorite (user_id, favorite_type, favorite_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: audit_log (Journal d'audit)
-- ============================================================================
CREATE TABLE audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INSERTION DE DONNÉES PAR DÉFAUT
-- ============================================================================

-- Utilisateurs par défaut
INSERT INTO users (email, password_hash, name, role, status) VALUES
('admin@amstrong.com', '$2y$10$abcdefghijklmnopqrstuvwxyz', 'Administrateur', 'admin', 'active'),
('manager@amstrong.com', '$2y$10$abcdefghijklmnopqrstuvwxyz', 'Manager', 'manager', 'active'),
('employee@amstrong.com', '$2y$10$abcdefghijklmnopqrstuvwxyz', 'Employé', 'employee', 'active');

-- Paramètres par défaut
INSERT INTO settings (setting_key, setting_value, description, data_type) VALUES
('currency', 'EUR', 'Devise par défaut (EUR, USD, CDF)', 'string'),
('exchange_rate_usd_cdf', '2800', 'Taux de change USD vers CDF', 'number'),
('gold_price_per_gram', '65', 'Prix de rachat de l\'or en euros par gramme', 'number'),
('company_name', 'AMSTRONG GATE', 'Nom de l\'entreprise', 'string'),
('company_logo_emoji', '⛏', 'Emoji du logo de l\'entreprise', 'string'),
('company_logo_color', 'bg-yellow-500', 'Couleur du logo', 'string');

-- Sites par défaut
INSERT INTO sites (name, location, manager_name, status) VALUES
('Site Principal - Vallée de l\'Or', 'Région Nord, Coordonnées: 5.2°N, 10.5°W', 'Jean Dupont', 'active'),
('Site Secondaire - Plateau Est', 'Région Est, Coordonnées: 4.8°N, 9.2°W', 'Marie Sow', 'active');

-- Équipes par défaut
INSERT INTO teams (site_id, name, manager_name, created_date, status) VALUES
(1, 'Équipe Excavation A', 'Ahmed Traore', '2025-01-15', 'active'),
(1, 'Équipe Excavation B', 'Fatima Diallo', '2025-01-20', 'active'),
(1, 'Équipe Raffinage', 'Kofi Mensah', '2025-02-01', 'active'),
(2, 'Équipe Plateau A', 'Ibrahim Kone', '2025-02-10', 'active'),
(2, 'Équipe Plateau B', 'Aissatou Ba', '2025-02-15', 'active');

-- Employés par défaut
INSERT INTO employees (team_id, name, function, monthly_salary, role, status) VALUES
(1, 'Moussa Diallo', 'Mineur', 350, 'employee', 'active'),
(1, 'Samba Ndiaye', 'Mineur', 350, 'employee', 'active'),
(1, 'Ousmane Cisse', 'Chef d\'équipe', 500, 'manager', 'active'),
(1, 'Lamine Toure', 'Mineur', 350, 'employee', 'active'),
(2, 'Mamadou Bah', 'Mineur', 350, 'employee', 'active'),
(2, 'Sekou Diallo', 'Mineur', 350, 'employee', 'active'),
(2, 'Boubacar Sow', 'Chef d\'équipe', 500, 'manager', 'active'),
(3, 'Youssouf Kone', 'Raffineur', 400, 'employee', 'active'),
(3, 'Amadou Traore', 'Chef d\'équipe', 550, 'manager', 'active'),
(4, 'Ibrahima Diallo', 'Mineur', 350, 'employee', 'active'),
(4, 'Moustapha Ba', 'Mineur', 350, 'employee', 'active'),
(4, 'Cheikh Sall', 'Chef d\'équipe', 500, 'manager', 'active'),
(5, 'Souleymane Ndiaye', 'Mineur', 350, 'employee', 'active'),
(5, 'Bah Kante', 'Chef d\'équipe', 500, 'manager', 'active');

-- ============================================================================
-- VUES UTILES POUR LES RAPPORTS
-- ============================================================================

-- Vue: Production totale par équipe
CREATE VIEW v_team_production_summary AS
SELECT 
  t.id,
  t.name AS team_name,
  s.name AS site_name,
  COUNT(p.id) AS total_productions,
  SUM(p.weight_grams) AS total_weight,
  SUM(p.estimated_value) AS total_value,
  AVG(p.purity_percentage) AS avg_purity
FROM teams t
LEFT JOIN sites s ON t.site_id = s.id
LEFT JOIN productions p ON t.id = p.team_id
GROUP BY t.id, t.name, s.name;

-- Vue: Dépenses totales par équipe
CREATE VIEW v_team_expenses_summary AS
SELECT 
  t.id,
  t.name AS team_name,
  s.name AS site_name,
  COUNT(e.id) AS total_expenses,
  SUM(e.amount) AS total_expenses_amount,
  GROUP_CONCAT(DISTINCT e.category) AS expense_categories
FROM teams t
LEFT JOIN sites s ON t.site_id = s.id
LEFT JOIN expenses e ON t.id = e.team_id
GROUP BY t.id, t.name, s.name;

-- Vue: Résumé financier par équipe
CREATE VIEW v_team_financial_summary AS
SELECT 
  t.id,
  t.name AS team_name,
  s.name AS site_name,
  COALESCE(SUM(p.estimated_value), 0) AS total_production_value,
  COALESCE(SUM(e.amount), 0) AS total_expenses,
  COALESCE(SUM(p.estimated_value), 0) - COALESCE(SUM(e.amount), 0) AS net_result,
  CASE 
    WHEN COALESCE(SUM(e.amount), 0) = 0 THEN 0
    ELSE ROUND(((COALESCE(SUM(p.estimated_value), 0) - COALESCE(SUM(e.amount), 0)) / COALESCE(SUM(e.amount), 1)) * 100, 2)
  END AS profitability_percentage
FROM teams t
LEFT JOIN sites s ON t.site_id = s.id
LEFT JOIN productions p ON t.id = p.team_id
LEFT JOIN expenses e ON t.id = e.team_id
GROUP BY t.id, t.name, s.name;

-- ============================================================================
-- FIN DU SCHÉMA
-- ============================================================================
