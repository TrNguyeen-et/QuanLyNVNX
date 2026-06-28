package com.example.backend.controllers;

import com.example.backend.entities.*;
import com.example.backend.repositories.*;
import com.example.backend.services.EmailService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/accountant")
@CrossOrigin(origins = "http://localhost:3000")
public class AccountantController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ShiftRepository shiftRepository;
    
    @Autowired
    private ShiftAssignmentRepository shiftAssignmentRepository;
    
    @Autowired
    private AttendanceRepository attendanceRepository;
    
    @Autowired
    private SalaryHistoryRepository salaryHistoryRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping("/upload-timesheet")
    public Map<String, Object> uploadTimesheet(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        
        int successCount = 0;
        int errorCount = 0;
        
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            
            // Skip header row
            if (rowIterator.hasNext()) {
                rowIterator.next();
            }
            
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            
            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                try {
                    // Columns: Họ tên (0), Ngày (1), Ca làm (2), Vị trí (3), Giờ vào (4), Giờ ra (5)
                    String fullName = getCellStringValue(row.getCell(0));
                    String dateStr = getCellStringValue(row.getCell(1));
                    String shiftName = getCellStringValue(row.getCell(2));
                    String position = getCellStringValue(row.getCell(3));
                    String checkInStr = getCellStringValue(row.getCell(4));
                    String checkOutStr = getCellStringValue(row.getCell(5));
                    
                    if (fullName == null || dateStr == null || shiftName == null) continue;
                    
                    List<User> users = userRepository.findByFullName(fullName);
                    User user = users.isEmpty() ? null : users.get(0);
                    if (user == null) {
                        errorCount++;
                        continue;
                    }
                    
                    LocalDate workDate = LocalDate.parse(dateStr, dateFormatter);
                    
                    // Note: In a real system, we'd search shift by name. Here we might need a workaround if shift names don't match exactly.
                    List<Shift> shifts = shiftRepository.findAll();
                    Shift targetShift = shifts.stream().filter(s -> s.getShiftName().equalsIgnoreCase(shiftName)).findFirst().orElse(null);
                    if (targetShift == null) {
                        errorCount++;
                        continue;
                    }
                    
                    // Find assignment
                    List<ShiftAssignment> assignments = shiftAssignmentRepository.findByUser(user);
                    ShiftAssignment assignment = assignments.stream()
                        .filter(a -> a.getWorkDate() != null && a.getWorkDate().equals(workDate) && a.getShift() != null && a.getShift().getId().equals(targetShift.getId()))
                        .findFirst().orElse(null);
                        
                    if (assignment == null) {
                        // Create one if missing for simplicity in this prototype
                        assignment = new ShiftAssignment();
                        assignment.setUser(user);
                        assignment.setShift(targetShift);
                        assignment.setWorkDate(workDate);
                        assignment.setStatus("COMPLETED");
                        assignment.setPosition(position != null && !position.trim().isEmpty() ? position : "CHAM_CONG_BU");
                        assignment = shiftAssignmentRepository.save(assignment);
                    } else {
                        assignment.setStatus("COMPLETED");
                        shiftAssignmentRepository.save(assignment);
                    }
                    
                    // Update attendance
                    Attendance attendance = attendanceRepository.findByShiftAssignment(assignment);
                    if (attendance == null) {
                        attendance = new Attendance();
                        attendance.setShiftAssignment(assignment);
                    }
                    
                    LocalDateTime checkInTime = null;
                    if (checkInStr != null && !checkInStr.trim().isEmpty()) {
                        checkInTime = LocalDateTime.of(workDate, LocalTime.parse(checkInStr, timeFormatter));
                        attendance.setCheckInTime(checkInTime);
                    }
                    
                    if (checkOutStr != null && !checkOutStr.trim().isEmpty()) {
                        LocalDateTime checkOutTime = LocalDateTime.of(workDate, LocalTime.parse(checkOutStr, timeFormatter));
                        attendance.setCheckOutTime(checkOutTime);
                    }
                    
                    // Calculate penalty
                    double penalty = 0.0;
                    if (checkInTime != null && targetShift.getStartTime() != null) {
                        LocalDateTime expectedCheckIn = LocalDateTime.of(workDate, targetShift.getStartTime());
                        // 15 mins grace period
                        if (checkInTime.isAfter(expectedCheckIn.plusMinutes(15))) {
                            penalty = 50000.0; // Fixed late penalty
                            attendance.setStatus("LATE");
                        } else {
                            attendance.setStatus("ON_TIME");
                        }
                    }
                    attendance.setPenaltyFee(penalty);
                    attendanceRepository.save(attendance);
                    
                    successCount++;
                } catch (Exception e) {
                    errorCount++;
                }
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi đọc file Excel: " + e.getMessage());
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("successCount", successCount);
        result.put("errorCount", errorCount);
        result.put("message", "Đã tải lên thành công " + successCount + " bản ghi. (Lỗi: " + errorCount + ")");
        return result;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC: 
                if (DateUtil.isCellDateFormatted(cell)) {
                    // This is a date or time
                    return cell.getLocalDateTimeCellValue().format(DateTimeFormatter.ofPattern("HH:mm"));
                }
                return String.valueOf((int) cell.getNumericCellValue());
            default: return null;
        }
    }
    
    @GetMapping("/salaries")
    public List<Map<String, Object>> getSalaryReport(@RequestParam("month") Integer month, @RequestParam("year") Integer year) {
        List<User> staffs = userRepository.findAll();
        List<Map<String, Object>> report = new ArrayList<>();
        
        for (User s : staffs) {
            Map<String, Object> item = new HashMap<>();
            item.put("userId", s.getId());
            item.put("name", s.getFullName());
            item.put("username", s.getUsername());
            
            List<ShiftAssignment> assigns = shiftAssignmentRepository.findByUser(s);
            double pay = 0, penalty = 0;
            int comp = 0, lateCount = 0;
            
            for (ShiftAssignment a : assigns) {
                if (a.getWorkDate() != null && a.getWorkDate().getMonthValue() == month && a.getWorkDate().getYear() == year) {
                    if ("COMPLETED".equals(a.getStatus()) || "DONE".equals(a.getStatus())) {
                        comp++;
                        if (a.getShift() != null && a.getShift().getShiftPrice() != null)
                            pay += a.getShift().getShiftPrice();
                        Attendance att = attendanceRepository.findByShiftAssignment(a);
                        if (att != null) {
                            if (att.getPenaltyFee() != null) penalty += att.getPenaltyFee();
                            if ("LATE".equals(att.getStatus())) lateCount++;
                        }
                    }
                }
            }
            
            if (comp > 0) {
                item.put("shifts", comp);
                item.put("pay", pay);
                item.put("penalty", penalty);
                item.put("lateCount", lateCount);
                item.put("final", pay - penalty);
                report.add(item);
            }
        }
        return report;
    }
    
    @PostMapping("/finalize-salary")
    public Map<String, Object> finalizeSalary(@RequestBody Map<String, Object> data) {
        Integer month = (Integer) data.get("month");
        Integer year = (Integer) data.get("year");
        
        if (month == null || year == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu month hoặc year");
        }
        
        List<SalaryHistory> existing = salaryHistoryRepository.findByMonthAndYear(month, year);
        if (!existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tháng " + month + "/" + year + " đã được chốt lương rồi!");
        }
        
        List<Map<String, Object>> report = getSalaryReport(month, year);
        int count = 0;
        
        for (Map<String, Object> item : report) {
            Long userId = (Long) item.get("userId");
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) continue;
            
            SalaryHistory history = new SalaryHistory();
            history.setUser(user);
            history.setMonth(month);
            history.setYear(year);
            history.setTotalShifts((Integer) item.get("shifts"));
            history.setTotalPay((Double) item.get("pay"));
            history.setTotalPenalty((Double) item.get("penalty"));
            history.setFinalSalary((Double) item.get("final"));
            history.setStatus("FINALIZED");
            history.setFinalizedAt(LocalDateTime.now());
            
            salaryHistoryRepository.save(history);
            
            // Gửi email phiếu lương
            int lateCount = (Integer) item.getOrDefault("lateCount", 0);
            emailService.sendPayslipEmail(
                user.getEmail(), 
                user.getFullName(), 
                "Tháng " + month + "/" + year, 
                history.getFinalSalary(), 
                history.getTotalShifts(), 
                lateCount, 
                history.getTotalPenalty()
            );
            
            count++;
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Đã chốt lương thành công cho " + count + " nhân viên.");
        return result;
    }
    
    @GetMapping("/finalized-salaries")
    public List<Map<String, Object>> getFinalizedSalaries(@RequestParam("month") Integer month, @RequestParam("year") Integer year) {
        List<SalaryHistory> list = salaryHistoryRepository.findByMonthAndYear(month, year);
        List<Map<String, Object>> result = new ArrayList<>();
        for (SalaryHistory h : list) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", h.getId());
            item.put("name", h.getUser() != null ? h.getUser().getFullName() : "N/A");
            item.put("shifts", h.getTotalShifts());
            item.put("pay", h.getTotalPay());
            item.put("penalty", h.getTotalPenalty());
            item.put("final", h.getFinalSalary());
            item.put("status", h.getStatus());
            item.put("finalizedAt", h.getFinalizedAt() != null ? h.getFinalizedAt().toString() : "");
            result.add(item);
        }
        return result;
    }
    
    @GetMapping("/salary-statistics")
    public List<Map<String, Object>> getSalaryStatistics(@RequestParam("year") Integer year) {
        List<SalaryHistory> list = salaryHistoryRepository.findByYear(year);
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", "Tháng " + i);
            
            final int m = i;
            double totalSalary = list.stream().filter(h -> h.getMonth() != null && h.getMonth() == m && h.getFinalSalary() != null).mapToDouble(SalaryHistory::getFinalSalary).sum();
            double totalPenalty = list.stream().filter(h -> h.getMonth() != null && h.getMonth() == m && h.getTotalPenalty() != null).mapToDouble(SalaryHistory::getTotalPenalty).sum();
            int totalShifts = list.stream().filter(h -> h.getMonth() != null && h.getMonth() == m && h.getTotalShifts() != null).mapToInt(SalaryHistory::getTotalShifts).sum();
            
            monthData.put("totalSalary", totalSalary);
            monthData.put("totalPenalty", totalPenalty);
            monthData.put("totalShifts", totalShifts);
            
            result.add(monthData);
        }
        return result;
    }
}
