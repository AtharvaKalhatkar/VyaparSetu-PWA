package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.dto.notification.FcmTokenRequest;
import com.vyaparsetu.dto.notification.NotificationDto;
import com.vyaparsetu.security.SecurityUtils;
import com.vyaparsetu.service.notification.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<NotificationDto>>> getUserNotifications(
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = SecurityUtils.getCurrentUserId();
        PagedResponse<NotificationDto> notifications = notificationService.getNotificationsByUser(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        UUID userId = SecurityUtils.getCurrentUserId();
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }

    @PostMapping("/register-device")
    public ResponseEntity<ApiResponse<Void>> registerDevice(@Valid @RequestBody FcmTokenRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        com.vyaparsetu.dto.notification.NotificationRequest notifReq = com.vyaparsetu.dto.notification.NotificationRequest.builder()
                .userId(userId)
                .title("Device Registered")
                .message("Device registered for notifications")
                .channel("PUSH")
                .type("INFO")
                .build();
        notificationService.createAndSend(UUID.randomUUID(), notifReq);
        return ResponseEntity.ok(ApiResponse.success("Device registered", null));
    }
}
