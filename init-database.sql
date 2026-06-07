-- ShopHub 数据库初始化脚本
-- 在服务器上执行: mysql -u root -p < init-database.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS shophub DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE shophub;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建店铺表
CREATE TABLE IF NOT EXISTS shops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  grade ENUM('A', 'B', 'C') NOT NULL DEFAULT 'A',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建检查记录表
CREATE TABLE IF NOT EXISTS shop_checks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shopId INT NOT NULL,
  serial VARCHAR(50) DEFAULT '',
  checkTime DATETIME NOT NULL,
  inspector VARCHAR(100) NOT NULL,
  problems JSON,
  problemCount INT DEFAULT 0,
  submitTime DATETIME DEFAULT CURRENT_TIMESTAMP,
  isDeleted TINYINT(1) DEFAULT 0 COMMENT '是否已删除(0:未删除,1:已删除)',
  FOREIGN KEY (shopId) REFERENCES shops(id) ON DELETE CASCADE,
  INDEX idx_isDeleted (isDeleted),
  INDEX idx_checkTime (checkTime),
  INDEX idx_shopId (shopId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入默认管理员账号
-- 密码: admin123 (已加密)
INSERT INTO users (username, password, name, role) VALUES 
('admin', '$2b$10$YourHashedPasswordHere', '系统管理员', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- 显示创建结果
SELECT '数据库初始化完成!' AS status;
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS shop_count FROM shops;
SELECT COUNT(*) AS check_count FROM shop_checks;
