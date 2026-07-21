package com.vyaparsetu.dto.sync;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncBatchRequest {
    private UUID batchId;
    private List<SyncPayload> payloads;
    private String deviceId;
    private UUID businessId;
}
