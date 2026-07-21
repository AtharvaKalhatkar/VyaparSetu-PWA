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
@Table(name = "sync_queue", indexes = {
    @Index(name = "idx_sync_queue_status", columnList = "status"),
    @Index(name = "idx_sync_queue_business", columnList = "businessId, status")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class SyncQueue extends BaseEntity {

    @Column(name = "business_id", nullable = false, columnDefinition = "UUID")
    private UUID businessId;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false, columnDefinition = "UUID")
    private UUID entityId;

    @Column(nullable = false, length = 20)
    private String operation;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "max_retries", nullable = false)
    @Builder.Default
    private Integer maxRetries = 5;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "next_retry_at")
    private Instant nextRetryAt;

    @Column(name = "queued_at", nullable = false)
    private Instant queuedAt;

    @Column(name = "processed_at")
    private Instant processedAt;
}
