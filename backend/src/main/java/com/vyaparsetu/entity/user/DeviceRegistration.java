package com.vyaparsetu.entity.user;

import com.vyaparsetu.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "device_registrations", indexes = {
    @Index(name = "idx_device_user", columnList = "userId"),
    @Index(name = "idx_device_id", columnList = "deviceId")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceRegistration extends BaseEntity {

    @Column(name = "user_id", nullable = false, columnDefinition = "UUID")
    private UUID userId;

    @Column(name = "device_id", nullable = false, length = 255)
    private String deviceId;

    @Column(name = "device_type", length = 20)
    private String deviceType;

    @Column(name = "device_name", length = 255)
    private String deviceName;

    @Column(name = "fcm_token", length = 500)
    private String fcmToken;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    @Column(name = "app_version", length = 20)
    private String appVersion;
}
