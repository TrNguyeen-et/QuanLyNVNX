package com.example.backend.services;

import com.example.backend.models.SystemConfig;
import com.example.backend.models.User;
import com.example.backend.repositories.AuditLogRepository;
import com.example.backend.repositories.SystemConfigRepository;
import com.example.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.backend.models.EmployeeImportDraft;
import java.time.LocalDateTime;

import com.example.backend.repositories.EmployeeImportDraftRepository;

@Service
@SuppressWarnings("null")
public class AdminService {

    @Autowired private SystemConfigRepository configRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private EmployeeImportDraftRepository employeeImportDraftRepository;
    @Autowired private EmailService emailService;

    // ==================== 1. QUẢN LÝ CẤU HÌNH HỆ THỐNG ====================
    
    public List<SystemConfig> getAllConfigs() {
        return configRepository.findAll();
    }

    public SystemConfig updateConfig(String key, String newValue) {
        SystemConfig config = configRepository.findById(key)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cấu hình: " + key));
        config.setConfigValue(newValue);
        return configRepository.save(config);
    }

    // Khởi tạo dữ liệu cấu hình mặc định nếu DB trống (chạy lần đầu)
    public void initDefaultConfigs() {
        if (configRepository.count() == 0) {
            saveConfig("PENALTY_15MIN", "20000", "Phạt đi trễ dưới 15 phút (Quy định QLNX_QĐ 3)");
            saveConfig("PENALTY_30MIN", "50000", "Phạt đi trễ từ 15 đến 30 phút");
            saveConfig("PENALTY_OVER_30MIN", "100000", "Phạt đi trễ trên 30 phút");
        }
    }

    private void saveConfig(String key, String value, String desc) {
        SystemConfig config = new SystemConfig();
        config.setConfigKey(key);
        config.setConfigValue(value);
        config.setDescription(desc);
        configRepository.save(config);
    }

    // ==================== 2. SAO LƯU & PHỤC HỒI DỮ LIỆU ====================

    /**
     * Sao lưu dữ liệu (Trả về Map chứa dữ liệu các bảng chính để Frontend export ra file JSON)
     */
    public Map<String, Object> backupData() {
        Map<String, Object> backup = new HashMap<>();
        backup.put("timestamp", LocalDateTime.now().toString());
        backup.put("users", userRepository.findAll());
        backup.put("auditLogs", auditLogRepository.findAll());
        // Bạn có thể thêm các bảng khác như shifts, assignments ở đây
        return backup;
    }

    /**
     * Phục hồi dữ liệu (Nhận List User từ file JSON upload lên)
     */
    public String restoreUsers(List<User> users) {
        userRepository.saveAll(users);
        return "Phục hồi thành công " + users.size() + " tài khoản!";
    }

    // ==================== QUẢN LÝ IMPORT HỒ SƠ ====================
    public List<EmployeeImportDraft> getPendingImports() {
        return employeeImportDraftRepository.findByStatus("PENDING");
    }

    public int approveImports(List<Long> draftIds, Long adminId) {
        if (draftIds == null || draftIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh sách ID rỗng");
        }

        List<EmployeeImportDraft> drafts = employeeImportDraftRepository.findAllById(draftIds);
        if (drafts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ nào");
        }

        int approvedCount = 0;
        for (EmployeeImportDraft draft : drafts) {
            if (!"PENDING".equals(draft.getStatus())) continue; // bỏ qua các hồ sơ không chờ

            // Tạo User mới
            User newUser = new User();
            newUser.setUsername(draft.getUsername());
            newUser.setFullName(draft.getFullName());
            // Mật khẩu mặc định: có thể là username hoặc một giá trị cố định
            newUser.setPassword(draft.getUsername()); // Nên mã hóa sau
            newUser.setRole(draft.getRole() != null ? draft.getRole() : "STAFF");
            newUser.setStatus("ACTIVE");
            newUser.setSalary(draft.getSalary() != null ? draft.getSalary() : 0.0);
            newUser.setWorkShift(draft.getWorkShift());
            newUser.setWorkDays(draft.getWorkDays());
            newUser.setPosition(draft.getPosition());
            newUser.setEmail(draft.getEmail());

            userRepository.save(newUser);

            // Gửi email chào mừng và cấp tài khoản
            if (newUser.getEmail() != null && !newUser.getEmail().trim().isEmpty()) {
                emailService.sendWelcomeEmail(
                    newUser.getEmail(), 
                    newUser.getFullName(), 
                    newUser.getUsername(), 
                    newUser.getPassword()
                );
            }

            // Cập nhật trạng thái draft
            draft.setStatus("APPROVED");
            draft.setProcessedBy(adminId);
            draft.setProcessedAt(LocalDateTime.now());
            employeeImportDraftRepository.save(draft);

            approvedCount++;
        }

        // Ghi log audit (nếu muốn)
        // auditLogRepository.save(...);

        return approvedCount;
    }

    public void rejectImports(List<Long> draftIds, Long adminId, String reason) {
        // Tương tự, có thể thêm nếu cần
    }
}
    