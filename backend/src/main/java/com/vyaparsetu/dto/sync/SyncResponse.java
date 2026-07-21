package com.vyaparsetu.dto.sync;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncResponse {
    private List<Map<String, Object>> entities;
    private Instant lastSyncTimestamp;
    private boolean hasMore;
    private int totalCount;
}
