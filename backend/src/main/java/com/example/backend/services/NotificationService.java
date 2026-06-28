package com.example.backend.services;

import com.example.backend.entities.Notification;
import com.example.backend.entities.User;
import com.example.backend.repositories.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public void createNotification(User user, String message, String type) {
        if (user == null) return;
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setType(type);
        notificationRepository.save(notification);
    }
}
