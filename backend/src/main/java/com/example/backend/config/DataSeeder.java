package com.example.backend.config;

import com.example.backend.models.User;
import com.example.backend.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword("admin123");
                admin.setRole("ADMIN");
                admin.setFullName("Quản trị viên");
                admin.setStatus("ACTIVE");
                userRepository.save(admin);

                User manager = new User();
                manager.setUsername("manager");
                manager.setPassword("manager123");
                manager.setRole("MANAGER");
                manager.setFullName("Quản lý nhà xe");
                manager.setStatus("ACTIVE");
                userRepository.save(manager);

                User staff = new User();
                staff.setUsername("staff");
                staff.setPassword("staff123");
                staff.setRole("STAFF");
                staff.setFullName("Nhân viên bãi xe");
                staff.setStatus("ACTIVE");
                userRepository.save(staff);
                
                System.out.println("Đã khởi tạo tài khoản mặc định: admin, manager, staff");
            }
        };
    }
}
