package com.vyaparsetu.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    private UUID userId;
    private String title;
    private String message;
    private String type;
    private String channel;
    private String referenceType;
    private String referenceId;
    private Instant scheduledAt;
}
