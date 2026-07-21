package com.vyaparsetu.dto.sync;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncResult {
    private UUID entityId;
    private String entityType;
    private String operation;
    private SyncStatus status;
    private Long serverVersion;
    private String errorMessage;

    public enum SyncStatus {
        SYNCED, CONFLICT, FAILED
    }
}
