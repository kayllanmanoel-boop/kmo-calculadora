CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','financeiro','consulta') NOT NULL DEFAULT 'financeiro',
  active TINYINT(1) NOT NULL DEFAULT 1,
  last_login DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  document VARCHAR(32) NULL,
  contract_no VARCHAR(80) NULL,
  object_text TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  reference_period VARCHAR(80) NULL,
  opening_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  status ENUM('aberta','finalizada') NOT NULL DEFAULT 'aberta',
  created_by INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_report_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id INT UNSIGNED NOT NULL,
  number VARCHAR(80) NULL,
  series VARCHAR(40) NULL,
  issue_date DATE NULL,
  gross_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  iss DECIMAL(14,2) NOT NULL DEFAULT 0,
  inss DECIMAL(14,2) NOT NULL DEFAULT 0,
  irrf DECIMAL(14,2) NOT NULL DEFAULT 0,
  pis DECIMAL(14,2) NOT NULL DEFAULT 0,
  cofins DECIMAL(14,2) NOT NULL DEFAULT 0,
  csll DECIMAL(14,2) NOT NULL DEFAULT 0,
  other_discount DECIMAL(14,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  source_original_name VARCHAR(255) NULL,
  source_storage_name VARCHAR(255) NULL,
  created_by INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_report FOREIGN KEY (report_id) REFERENCES account_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoice_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id INT UNSIGNED NOT NULL,
  invoice_id INT UNSIGNED NULL,
  type ENUM('entrada','saida') NOT NULL,
  transaction_date DATE NOT NULL,
  description VARCHAR(255) NOT NULL,
  party VARCHAR(180) NULL,
  document_no VARCHAR(100) NULL,
  payment_method VARCHAR(80) NULL,
  category VARCHAR(100) NULL,
  amount DECIMAL(14,2) NOT NULL,
  attachment_original_name VARCHAR(255) NULL,
  attachment_storage_name VARCHAR(255) NULL,
  created_by INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transaction_report FOREIGN KEY (report_id) REFERENCES account_reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_transaction_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  CONSTRAINT fk_transaction_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  details TEXT NULL,
  ip_address VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
