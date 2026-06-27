package com.example.backend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendWelcomeEmail(String toEmail, String fullName, String username, String password) {
        if (toEmail == null || toEmail.trim().isEmpty()) return;
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("gigasmash476996@gmail.com");
            message.setTo(toEmail);
            message.setSubject("Tài khoản đăng nhập hệ thống Quản lý nhà xe");
            message.setText("Xin chào " + fullName + ",\n\n"
                    + "Tài khoản của bạn đã được tạo thành công trên hệ thống Quản lý nhà xe.\n"
                    + "Thông tin đăng nhập của bạn như sau:\n\n"
                    + "Tên đăng nhập: " + username + "\n"
                    + "Mật khẩu: " + password + "\n\n"
                    + "Vui lòng đăng nhập và đổi mật khẩu sớm nhất có thể.\n\n"
                    + "Trân trọng,\nBan quản lý");
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Không thể gửi email Welcome đến: " + toEmail);
        }
    }

    public void sendPayslipEmail(String toEmail, String fullName, String monthYear, double netSalary, int totalShifts, int lateCount, double totalPenalty) {
        if (toEmail == null || toEmail.trim().isEmpty()) return;
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("gigasmash476996@gmail.com");
            message.setTo(toEmail);
            message.setSubject("Phiếu lương " + monthYear + " - Quản lý nhà xe");
            message.setText("Xin chào " + fullName + ",\n\n"
                    + "Đây là chi tiết phiếu lương của bạn trong " + monthYear + ":\n\n"
                    + "- Tổng số ca hoàn thành: " + totalShifts + "\n"
                    + "- Số lần đi trễ: " + lateCount + "\n"
                    + "- Tổng tiền phạt: " + String.format("%,.0f", totalPenalty) + " VNĐ\n"
                    + "- LƯƠNG THỰC NHẬN: " + String.format("%,.0f", netSalary) + " VNĐ\n\n"
                    + "Nếu có thắc mắc, vui lòng liên hệ bộ phận Kế toán.\n\n"
                    + "Trân trọng,\nBộ phận Kế toán");
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Không thể gửi email Phiếu lương đến: " + toEmail);
        }
    }
}
