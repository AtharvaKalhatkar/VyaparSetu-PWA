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
public class SyncPayload {
    private String entityType;
    private UUID entityId;
    private String operation;
    private Object data;
    private String deviceId;
    private Instant clientTimestamp;
}
