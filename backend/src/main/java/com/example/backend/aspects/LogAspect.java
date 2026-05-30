package com.example.backend.aspects;

import com.example.backend.annotations.LogAction;
import com.example.backend.models.AppLog;
import com.example.backend.repositories.AppLogRepository;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

@Aspect
@Component
public class LogAspect {

    @Autowired
    private AppLogRepository logRepository;

    @AfterReturning(value = "@annotation(com.example.backend.annotations.LogAction)", returning = "result")
    public void logBusinessAction(JoinPoint joinPoint, Object result) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        LogAction logAction = method.getAnnotation(LogAction.class);

        String actionDescription = logAction.value();
        String methodName = method.getName();
        
        // Tạo log
        AppLog log = new AppLog();
        log.setType("BUSINESS");
        log.setAction(actionDescription);
        log.setDescription("Gọi hàm: " + methodName);
        log.setTimestamp(LocalDateTime.now());
        // Do chưa có SecurityContext, ta có thể lưu tạm userId = 0 (Hệ thống) hoặc null
        log.setUserId(0L); 

        logRepository.save(log);
    }
}
