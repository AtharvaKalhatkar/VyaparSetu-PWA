package com.vyaparsetu.entity.sync;

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
@Table(name = "sync_logs", indexes = {
    @Index(name = "idx_sync_entity_status", columnList = "businessId, entityType, status"),
    @Index(name = "idx_sync_device_status", columnList = "deviceId, status")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class SyncLog extends BaseEntity {

    @Column(name = "business_id", nullable = false, columnDefinition = "UUID")
    private UUID businessId;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", columnDefinition = "UUID")
    private UUID entityId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SyncOperation operation;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(name = "synced_at", nullable = false)
    private Instant syncedAt;

    @Column(name = "conflict_resolved", nullable = false)
    @Builder.Default
    private boolean conflictResolved = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SyncStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    public enum SyncOperation {
        CREATE, UPDATE, DELETE
    }

    public enum SyncStatus {
        PENDING, SYNCED, FAILED, CONFLICT
    }
}
