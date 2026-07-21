package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.dto.sync.SyncBatchRequest;
import com.vyaparsetu.dto.sync.SyncBatchResponse;
import com.vyaparsetu.dto.sync.SyncRequest;
import com.vyaparsetu.dto.sync.SyncResponse;
import com.vyaparsetu.security.SecurityUtils;
import com.vyaparsetu.service.sync.SyncService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
@Slf4j
public class SyncController {

    private final SyncService syncService;

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<SyncBatchResponse>> processSyncBatch(
            @Valid @RequestBody SyncBatchRequest request) {
        SyncBatchResponse response = syncService.processSyncBatch(request);
        return ResponseEntity.ok(ApiResponse.success("Batch processed", response));
    }

    @PostMapping("/changes")
    public ResponseEntity<ApiResponse<SyncResponse>> getChangesSince(
            @Valid @RequestBody SyncRequest request) {
        UUID businessId = SecurityUtils.getCurrentUserBusinessId();
        SyncResponse response = syncService.getChangesSince(businessId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/resolve-conflict")
    public ResponseEntity<ApiResponse<Void>> resolveConflict(
            @RequestParam UUID businessId,
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            @RequestBody Map<String, Object> resolvedData) {
        syncService.resolveConflict(businessId, entityType, entityId, resolvedData);
        return ResponseEntity.ok(ApiResponse.success("Conflict resolved", null));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSyncStatus(
            @RequestParam UUID businessId) {
        Map<String, Object> status = Map.of("businessId", businessId.toString(), "status", "active");
        return ResponseEntity.ok(ApiResponse.success(status));
    }
}
