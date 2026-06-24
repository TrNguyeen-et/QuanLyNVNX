package com.example.backend;

import com.example.backend.services.AdminService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    // THÊM MỚI: Tự động chạy khi app start để tạo config mặc định
    @Bean
    public CommandLineRunner initData(AdminService adminService) {
        return args -> {
            adminService.initDefaultConfigs();
            System.out.println(">>> He thong da san sang! Cau hinh mac da duoc khoi tao.");
        };
    }
}