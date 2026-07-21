package com.vyaparsetu.dto.user;

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
public class DeviceDto {
    private UUID id;
    private String deviceId;
    private String deviceType;
    private String deviceName;
    private String fcmToken;
    private boolean isActive;
    private Instant lastSyncedAt;
}
