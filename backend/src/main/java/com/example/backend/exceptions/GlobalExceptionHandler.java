package com.example.backend.exceptions;

import com.example.backend.models.AppLog;
import com.example.backend.repositories.AppLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @Autowired
    private AppLogRepository logRepository;

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAllExceptions(Exception ex) {
        // Ghi log hệ thống
        AppLog log = new AppLog();
        log.setType("SYSTEM");
        log.setAction("Lỗi Hệ Thống");
        
        // Cắt bớt description nếu quá dài để tránh lỗi DB
        String message = ex.getMessage();
        if (message != null && message.length() > 1900) {
            message = message.substring(0, 1900);
        }
        log.setDescription(message != null ? message : "NullPointerException");
        log.setTimestamp(LocalDateTime.now());
        log.setUserId(0L);
        
        try {
            logRepository.save(log);
        } catch (Exception e) {
            e.printStackTrace();
        }

        Map<String, String> response = new HashMap<>();
        response.put("error", "Đã xảy ra lỗi hệ thống: " + ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
