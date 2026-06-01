-- ===========================================================
-- INIT DATA - HỆ THỐNG QUẢN LÝ NHÀ XE
-- Chạy file này để reset + tạo dữ liệu mẫu đầy đủ
-- ===========================================================

CREATE DATABASE IF NOT EXISTS quan_ly_nha_xe;
USE quan_ly_nha_xe;

-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(255),
    status VARCHAR(255),
    full_name VARCHAR(255),
    salary DOUBLE,
    work_shift VARCHAR(255),
    work_days VARCHAR(255)
);

DELETE FROM users;
ALTER TABLE users AUTO_INCREMENT = 1;

INSERT INTO users (username, password, role, status, full_name, salary, work_shift, work_days) VALUES
-- ── ADMIN ──────────────────────────────────────────────────
('admin',    '123456', 'ADMIN',   'ACTIVE', 'Nguyen Admin',      0,          NULL,      NULL),
-- ── MANAGER ────────────────────────────────────────────────
('manager',  '123456', 'MANAGER', 'ACTIVE', 'Tran Quan Ly',      0,          NULL,      NULL),
-- ── STAFF ──────────────────────────────────────────────────
('staff1',   '123456', 'STAFF',   'ACTIVE', 'Le Tai Xe 1',       15000000,   'SHIFT 1', 'Monday,Tuesday,Wednesday'),
('staff2',   '123456', 'STAFF',   'ACTIVE', 'Pham Phu Xe 1',     12000000,   'SHIFT 1', 'Monday,Tuesday,Wednesday'),
('staff3',   '123456', 'STAFF',   'ACTIVE', 'Nguyen Bao Ve',     11000000,   'SHIFT 2', 'Thursday,Friday,Saturday'),
('staff4',   '123456', 'STAFF',   'ACTIVE', 'Tran Kiem Soat',    13000000,   'SHIFT 2', 'Thursday,Friday,Saturday'),
-- ── HR ─────────────────────────────────────────────────────
('hr',       '123456', 'HR',      'ACTIVE', 'Van Hanh Chinh',    0,          NULL,      NULL);

-- ── SHIFTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shift_name VARCHAR(255),
    start_time TIME,
    end_time TIME,
    shift_price DOUBLE
);

DELETE FROM shifts;
ALTER TABLE shifts AUTO_INCREMENT = 1;

INSERT INTO shifts (shift_name, start_time, end_time, shift_price) VALUES
('Ca Sang',   '06:00:00', '14:00:00', 500000),
('Ca Chieu',  '14:00:00', '22:00:00', 550000),
('Ca Dem',    '22:00:00', '06:00:00', 600000);

-- ── SYSTEM CONFIGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_configs (
    config_key   VARCHAR(255) PRIMARY KEY,
    config_value VARCHAR(255),
    description  VARCHAR(255)
);

DELETE FROM system_configs;

INSERT INTO system_configs (config_key, config_value, description) VALUES
('PENALTY_15MIN',      '20000',  'Phat di tre duoi 15 phut (Quy dinh QLNX_QD 3)'),
('PENALTY_30MIN',      '50000',  'Phat di tre tu 15 den 30 phut'),
('PENALTY_OVER_30MIN', '100000', 'Phat di tre tren 30 phut');

-- ── SHIFT ASSIGNMENTS (mẫu để test) ───────────────────────
CREATE TABLE IF NOT EXISTS shift_assignments (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    position VARCHAR(255),
    status   VARCHAR(255),
    work_date DATE,
    shift_id BIGINT,
    user_id  BIGINT
);

DELETE FROM shift_assignments;
ALTER TABLE shift_assignments AUTO_INCREMENT = 1;

-- Ca hôm nay cho staff1 và staff2 (để test checkin/checkout)
INSERT INTO shift_assignments (position, status, work_date, shift_id, user_id) VALUES
('XEP_XE',       'SCHEDULED', CURDATE(), 1, 3),   -- staff1 Ca Sang
('KIEM_SOAT_VE', 'SCHEDULED', CURDATE(), 1, 4),   -- staff2 Ca Sang
('XEP_XE',       'SCHEDULED', CURDATE(), 2, 5),   -- staff3 Ca Chieu
('KIEM_SOAT_VE', 'SCHEDULED', CURDATE(), 2, 6),   -- staff4 Ca Chieu
-- Ca ngày mai
('XEP_XE',       'SCHEDULED', CURDATE() + INTERVAL 1 DAY, 1, 3),
('KIEM_SOAT_VE', 'SCHEDULED', CURDATE() + INTERVAL 1 DAY, 1, 4);

-- ── CÁC BẢNG PHỤ ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendances (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    check_in_time  DATETIME,
    check_out_time DATETIME,
    penalty_fee    DOUBLE,
    status         VARCHAR(255),
    assignment_id  BIGINT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    action    VARCHAR(255),
    actor     VARCHAR(255),
    timestamp DATETIME
);

CREATE TABLE IF NOT EXISTS incidents (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    content     VARCHAR(255),
    report_time DATETIME,
    status      VARCHAR(255),
    user_id     BIGINT
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    reason              VARCHAR(255),
    request_type        VARCHAR(255),
    status              VARCHAR(255),
    target_date         DATE,
    substitute_user_id  BIGINT,
    user_id             BIGINT
);
