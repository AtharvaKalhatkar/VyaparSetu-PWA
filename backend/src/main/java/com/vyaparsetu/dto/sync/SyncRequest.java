package com.vyaparsetu.dto.sync;

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
public class SyncRequest {
    private String entityType;
    private Instant lastSyncedAt;
    private String deviceId;
    private UUID businessId;
    private int page;
    private int size;
}
