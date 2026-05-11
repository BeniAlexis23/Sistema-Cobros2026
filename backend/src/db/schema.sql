CREATE DATABASE IF NOT EXISTS sistema_cobros
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

ALTER DATABASE sistema_cobros
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sistema_cobros;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  document_number VARCHAR(30),
  phone VARCHAR(30),
  email VARCHAR(160),
  address VARCHAR(255),
  payment_status ENUM('paid', 'pending') NOT NULL DEFAULT 'pending',
  amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
  billing_year INT NOT NULL DEFAULT 2026,
  paid_months JSON,
  balance_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
  last_payment_date DATE,
  last_payment_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  last_payment_type ENUM('full', 'partial'),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_clients_user_status (user_id, payment_status),
  INDEX idx_clients_due_date (due_date)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT,
  user_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_invoice_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  user_id INT NOT NULL,
  payment_date DATE NOT NULL,
  payment_type ENUM('full', 'partial') NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  balance_after DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_payment_client_date (client_id, payment_date)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS client_payment_years (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  user_id INT NOT NULL,
  billing_year INT NOT NULL,
  paid_months JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_year_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_year_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_client_year (client_id, billing_year)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
