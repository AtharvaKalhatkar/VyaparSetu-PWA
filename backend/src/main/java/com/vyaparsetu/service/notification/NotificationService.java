package com.vyaparsetu.service.notification;

import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.mapper.NotificationMapper;
import com.vyaparsetu.dto.notification.NotificationDto;
import com.vyaparsetu.dto.notification.NotificationRequest;
import com.vyaparsetu.entity.notification.Notification;
import com.vyaparsetu.entity.notification.Notification.NotificationChannel;
import com.vyaparsetu.entity.notification.Notification.NotificationStatus;
import com.vyaparsetu.entity.notification.Notification.NotificationType;
import com.vyaparsetu.repository.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    @Transactional
    public NotificationDto createAndSend(UUID businessId, NotificationRequest request) {
        log.info("Creating and sending notification in business: {}", businessId);

        Notification notification = Notification.builder()
                .businessId(businessId)
                .userId(request.getUserId())
                .title(request.getTitle())
                .message(request.getMessage())
                .type(request.getType() != null ? NotificationType.valueOf(request.getType().toUpperCase()) : NotificationType.INFO)
                .channel(request.getChannel() != null ? NotificationChannel.valueOf(request.getChannel().toUpperCase()) : NotificationChannel.PUSH)
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .sentAt(Instant.now())
                .status(NotificationStatus.PENDING)
                .scheduledAt(request.getScheduledAt())
                .build();
        notification = notificationRepository.save(notification);

        try {
            switch (notification.getChannel()) {
                case PUSH -> sendPushNotification(request.getUserId(), request.getTitle(), request.getMessage());
                case SMS -> sendSms(null, request.getMessage());
                case EMAIL -> sendEmail(null, request.getTitle(), request.getMessage());
                case WHATSAPP -> sendWhatsApp(null, request.getMessage(), null, null);
            }
            notification.setStatus(NotificationStatus.SENT);
            notification.setDeliveredAt(Instant.now());
        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
            notification.setStatus(NotificationStatus.FAILED);
        }
        notification = notificationRepository.save(notification);

        return notificationMapper.toDto(notification);
    }

    public void sendPushNotification(UUID userId, String title, String message) {
        log.info("Mock push notification to user: {}, title: {}, message: {}", userId, title, message);
    }

    public void sendSms(String phone, String message) {
        log.info("Mock SMS to: {}, message: {}", phone, message);
    }

    public void sendEmail(String to, String subject, String body) {
        log.info("Mock Email to: {}, subject: {}, body: {}", to, subject, body);
    }

    public void sendWhatsApp(String phone, String message, String templateName, Map<String, String> parameters) {
        log.info("Mock WhatsApp to: {}, template: {}, params: {}", phone, templateName, parameters);
    }

    @Transactional
    public void sendInvoiceViaWhatsApp(UUID businessId, UUID invoiceId, String phone) {
        log.info("Mock sending invoice {} via WhatsApp to {} in business {}", invoiceId, phone, businessId);
        sendWhatsApp(phone, "Your invoice is ready", "invoice_template",
                Map.of("invoiceId", invoiceId.toString()));
    }

    @Transactional(readOnly = true)
    public PagedResponse<NotificationDto> getNotificationsByUser(UUID userId, Pageable pageable) {
        Page<Notification> notificationPage = notificationRepository.findByUserId(userId, pageable);
        return PagedResponse.of(notificationMapper.toDtoList(notificationPage.getContent()),
                pageable.getPageNumber(), pageable.getPageSize(),
                notificationPage.getTotalElements());
    }

    @Transactional
    public void markAsRead(UUID notificationId) {
        log.info("Marking notification as read: {}", notificationId);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        notification.setRead(true);
        notification.setReadAt(Instant.now());
        notification.setStatus(NotificationStatus.READ);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByBusinessIdAndUserIdAndIsReadFalse(null, userId);
    }
}
