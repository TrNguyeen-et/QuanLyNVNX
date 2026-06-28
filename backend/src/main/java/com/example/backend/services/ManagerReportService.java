package com.example.backend.services;

import com.example.backend.entities.*;
import com.example.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

import org.apache.poi.ss.usermodel.*;
import org.springframework.web.multipart.MultipartFile;
import com.example.backend.repositories.EmployeeImportDraftRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.ArrayList;

@Service
@SuppressWarnings("null")
public class ManagerReportService {

    @Autowired private UserRepository userRepository;
    @Autowired private ShiftAssignmentRepository shiftAssignmentRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private EmployeeImportDraftRepository employeeImportDraftRepository;

    public List<Map<String, Object>> getMonthlyReport(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end   = YearMonth.of(year, month).atEndOfMonth();

        List<User> allStaff = userRepository.findByRole("STAFF");
        List<Map<String, Object>> report = new ArrayList<>();

        for (User staff : allStaff) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("staffId",   staff.getId());
            row.put("staffName", staff.getFullName());
            row.put("username",  staff.getUsername());
            row.put("status",    staff.getStatus());

            List<ShiftAssignment> assignments =
                shiftAssignmentRepository.findByUserAndWorkDateBetween(staff, start, end);

            int totalShifts = assignments.size();
            int doneShifts  = 0, lateCount = 0, absentCount = 0;
            double totalPay = 0, totalPenalty = 0;

            for (ShiftAssignment sa : assignments) {
                Attendance att = attendanceRepository.findByShiftAssignment(sa);
                if (att == null || att.getCheckInTime() == null) {
                    absentCount++;
                } else {
                    if ("COMPLETED".equals(att.getStatus()) || "DONE".equals(sa.getStatus())) {
                        doneShifts++;
                        if (sa.getShift() != null && sa.getShift().getShiftPrice() != null)
                            totalPay += sa.getShift().getShiftPrice();
                    }
                    if ("LATE".equals(att.getStatus())) lateCount++;
                    if (att.getPenaltyFee() != null) totalPenalty += att.getPenaltyFee();
                }
            }

            // FIX: dùng đúng method signature có trong LeaveRequestRepository
            List<LeaveRequest> approvedLeaves =
                leaveRequestRepository.findByUserAndTargetDateBetweenAndStatus(staff, start, end, "APPROVED");
            int leaveCount = (int) approvedLeaves.stream()
                    .filter(r -> "LEAVE".equals(r.getRequestType())).count();

            row.put("totalShifts",  totalShifts);
            row.put("doneShifts",   doneShifts);
            row.put("absentCount",  absentCount);
            row.put("lateCount",    lateCount);
            row.put("leaveCount",   leaveCount);
            row.put("totalPay",     totalPay);
            row.put("totalPenalty", totalPenalty);
            row.put("netSalary",    totalPay - totalPenalty);
            report.add(row);
        }
        return report;
    }

    //Thêm nhân viên từ excel
    public Map<String, Object> importStaffFromExcel(MultipartFile file, Long hrId) throws Exception {
        // Kiểm tra file
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File rỗng!");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !(originalFilename.endsWith(".xlsx") || originalFilename.endsWith(".xls"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ file Excel (.xlsx, .xls)");
        }

        // Đọc file Excel
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0); // Lấy sheet đầu tiên
            int importedCount = 0;
            List<String> errors = new ArrayList<>();
            Set<String> assignedInThisBatch = new HashSet<>();
            List<EmployeeImportDraft> importedDrafts = new ArrayList<>();

            // Duyệt từ dòng 2 (bỏ qua header)
            for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null) continue;

                try {
                    // Cấu trúc cột: 0: Họ tên, 1: Email, 2: Vai trò, 3: Lương, 4: Ngày bắt đầu
                    String fullName = getCellString(row.getCell(0));
                    String email = getCellString(row.getCell(1));
                    String roleStr = getCellString(row.getCell(2));
                    Double salary = getCellDouble(row.getCell(3));
                    String workDays = getCellString(row.getCell(4));

                    // Validate
                    if (fullName == null || fullName.trim().isEmpty()) {
                        errors.add("Dòng " + (rowIndex+1) + ": Tên không được để trống");
                        continue;
                    }
                    
                    String role = "ACCOUNTANT".equalsIgnoreCase(roleStr) || "Kế toán".equalsIgnoreCase(roleStr) ? "ACCOUNTANT" : "STAFF";

                    // Sinh tài khoản tự động
                    String prefix = "STAFF".equals(role) ? "nv" : "kt";
                    int count = 1;
                    String username = String.format("%s%03d", prefix, count);
                    while (assignedInThisBatch.contains(username) ||
                           employeeImportDraftRepository.existsByUsername(username) ||
                           userRepository.findByUsername(username).isPresent()) {
                        count++;
                        username = String.format("%s%03d", prefix, count);
                    }
                    assignedInThisBatch.add(username);

                    // Tạo bản ghi draft
                    EmployeeImportDraft draft = new EmployeeImportDraft();
                    draft.setFullName(fullName.trim());
                    draft.setUsername(username);
                    draft.setEmail(email != null ? email.trim() : "");
                    draft.setSalary(salary != null ? salary : 0.0);
                    draft.setWorkDays(workDays != null ? workDays.trim() : "");
                    draft.setRole(role);
                    draft.setStatus("PREVIEW");
                    draft.setUploadedBy(hrId);
                    draft.setUploadedAt(LocalDateTime.now());

                    employeeImportDraftRepository.save(draft);
                    importedDrafts.add(draft);
                    importedCount++;

                } catch (Exception e) {
                    errors.add("Dòng " + (rowIndex+1) + ": Lỗi xử lý - " + e.getMessage());
                }
            }

            if (importedCount == 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không có dòng nào hợp lệ để import. Chi tiết lỗi: " + String.join("; ", errors));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("message", "Đã parse thành công " + importedCount + " hồ sơ. (Lỗi: " + errors.size() + " dòng)");
            result.put("drafts", importedDrafts);
            return result;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi đọc file Excel: " + e.getMessage());
        }
    }

    // Helper methods để đọc dữ liệu từ cell an toàn
    private String getCellString(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC: 
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                }
                return String.valueOf(cell.getNumericCellValue());
            default: return null;
        }
    }

    private Double getCellDouble(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return cell.getNumericCellValue();
        }
        return null;
    }
}