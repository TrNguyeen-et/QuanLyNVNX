CREATE DATABASE IF NOT EXISTS quan_ly_nha_xe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quan_ly_nha_xe;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50),
    status VARCHAR(50)
);

INSERT INTO users (username, password, full_name, role, status) VALUES 
('admin', '123456', 'Quản trị viên', 'ADMIN', 'ACTIVE'),
('manager', '123456', 'Quản lý', 'MANAGER', 'ACTIVE');
