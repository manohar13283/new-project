-- Email OTP Admin System schema
-- Standalone PHP subsystem; not managed by the NestJS backend's TypeORM migrations.

CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(20) NULL,
  role ENUM('super_admin','admin','supervisor','viewer') NOT NULL DEFAULT 'admin',
  permissions JSON NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_by INT UNSIGNED NULL,
  last_login DATETIME NULL,
  login_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_users_email (email),
  CONSTRAINT fk_admin_users_created_by FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_otp (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  purpose VARCHAR(30) NOT NULL DEFAULT 'login',
  expires_at DATETIME NOT NULL,
  verified_at DATETIME NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_admin_otp_email_created (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NULL,
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  description TEXT NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_admin_activity_admin (admin_id),
  KEY idx_admin_activity_created (created_at),
  CONSTRAINT fk_admin_activity_admin FOREIGN KEY (admin_id) REFERENCES admin_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bootstrap the first Super Admin so the OTP login flow has somewhere to log in to.
-- Update the email below to a real inbox before first use.
INSERT INTO admin_users (name, email, role, status, permissions)
VALUES ('Super Admin', 'superadmin@myunioncanteen.local', 'super_admin', 'active', NULL)
ON DUPLICATE KEY UPDATE email = email;
