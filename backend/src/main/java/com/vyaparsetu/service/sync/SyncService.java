package com.vyaparsetu.service.sync;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.BadRequestException;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.sync.SyncBatchRequest;
import com.vyaparsetu.dto.sync.SyncBatchResponse;
import com.vyaparsetu.dto.sync.SyncPayload;
import com.vyaparsetu.dto.sync.SyncRequest;
import com.vyaparsetu.dto.sync.SyncResponse;
import com.vyaparsetu.dto.sync.SyncResult;
import com.vyaparsetu.dto.sync.SyncResult.SyncStatus;
import com.vyaparsetu.entity.sync.SyncLog;
import com.vyaparsetu.entity.sync.SyncLog.SyncOperation;
import com.vyaparsetu.entity.sync.SyncQueue;
import com.vyaparsetu.repository.sync.SyncLogRepository;
import com.vyaparsetu.repository.sync.SyncQueueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyncService {

    private final SyncQueueRepository syncQueueRepository;
    private final SyncLogRepository syncLogRepository;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;

    @Transactional
    public SyncBatchResponse processSyncBatch(SyncBatchRequest request) {
        log.info("Processing sync batch: {} for business: {}", request.getBatchId(), request.getBusinessId());

        UUID businessId = request.getBusinessId();
        List<SyncResult> results = new ArrayList<>();
        for (SyncPayload payload : request.getPayloads()) {
            try {
                SyncResult result = processSyncPayload(payload, businessId);
                results.add(result);
            } catch (Exception e) {
                log.error("Failed to process sync payload for entity {}: {}", payload.getEntityId(), e.getMessage());
                results.add(SyncResult.builder()
                        .entityId(payload.getEntityId())
                        .entityType(payload.getEntityType())
                        .operation(payload.getOperation())
                        .status(SyncStatus.FAILED)
                        .errorMessage(e.getMessage())
                        .build());
            }
        }

        return SyncBatchResponse.builder()
                .batchId(request.getBatchId())
                .results(results)
                .build();
    }

    @Transactional
    public SyncResult processSyncPayload(SyncPayload payload, UUID businessId) {
        log.info("Processing sync payload for entity: {} id: {} operation: {}",
                payload.getEntityType(), payload.getEntityId(), payload.getOperation());

        Optional<SyncQueue> existingQueue = syncQueueRepository
                .findByBusinessIdAndEntityTypeAndEntityIdAndOperation(
                        businessId, payload.getEntityType(), payload.getEntityId(), payload.getOperation())
                .stream().findFirst();

        if (existingQueue.isPresent()) {
            SyncQueue queueItem = existingQueue.get();
            if (queueItem.getRetryCount() >= queueItem.getMaxRetries()) {
                return SyncResult.builder()
                        .entityId(payload.getEntityId())
                        .entityType(payload.getEntityType())
                        .operation(payload.getOperation())
                        .status(SyncStatus.FAILED)
                        .errorMessage("Max retries exceeded")
                        .build();
            }
        }

        try {
            String payloadJson = objectMapper.writeValueAsString(payload.getData());

            SyncQueue syncQueue = SyncQueue.builder()
                    .businessId(businessId)
                    .entityType(payload.getEntityType())
                    .entityId(payload.getEntityId())
                    .operation(payload.getOperation())
                    .payload(payloadJson)
                    .deviceId(payload.getDeviceId())
                    .status("PENDING")
                    .retryCount(0)
                    .maxRetries(5)
                    .queuedAt(Instant.now())
                    .build();
            syncQueueRepository.save(syncQueue);

            SyncLog syncLog = SyncLog.builder()
                    .businessId(businessId)
                    .entityType(payload.getEntityType())
                    .entityId(payload.getEntityId())
                    .operation(SyncOperation.valueOf(payload.getOperation().toUpperCase()))
                    .deviceId(payload.getDeviceId())
                    .payload(payloadJson)
                    .syncedAt(Instant.now())
                    .status(SyncLog.SyncStatus.SYNCED)
                    .build();
            syncLogRepository.save(syncLog);

            auditService.logEvent(businessId.toString(), "SYNC_" + payload.getOperation().toUpperCase(),
                    payload.getEntityType(), payload.getEntityId(), null,
                    Map.of("deviceId", payload.getDeviceId()));

            return SyncResult.builder()
                    .entityId(payload.getEntityId())
                    .entityType(payload.getEntityType())
                    .operation(payload.getOperation())
                    .status(SyncStatus.SYNCED)
                    .build();

        } catch (JsonProcessingException e) {
            return SyncResult.builder()
                    .entityId(payload.getEntityId())
                    .entityType(payload.getEntityType())
                    .operation(payload.getOperation())
                    .status(SyncStatus.FAILED)
                    .errorMessage("Failed to serialize payload: " + e.getMessage())
                    .build();
        }
    }

    @Transactional(readOnly = true)
    public SyncResponse getChangesSince(UUID businessId, SyncRequest request) {
        log.info("Getting changes since: {} for business: {} entity: {}",
                request.getLastSyncedAt(), businessId, request.getEntityType());

        List<SyncLog> syncLogs;
        if (request.getEntityType() != null && !request.getEntityType().isBlank()) {
            syncLogs = syncLogRepository.findByBusinessIdAndEntityType(businessId,
                    request.getEntityType(), org.springframework.data.domain.PageRequest.of(0, 1000))
                    .getContent();
        } else {
            syncLogs = syncLogRepository.findByBusinessId(businessId,
                    org.springframework.data.domain.PageRequest.of(0, 1000)).getContent();
        }

        List<Map<String, Object>> entities = new ArrayList<>();
        for (SyncLog log : syncLogs) {
            if (log.getSyncedAt().isAfter(request.getLastSyncedAt())) {
                Map<String, Object> entity = new HashMap<>();
                entity.put("entityType", log.getEntityType());
                entity.put("entityId", log.getEntityId());
                entity.put("operation", log.getOperation().name());
                entity.put("data", log.getPayload());
                entity.put("syncedAt", log.getSyncedAt());
                entities.add(entity);
            }
        }

        return SyncResponse.builder()
                .entities(entities)
                .lastSyncTimestamp(Instant.now())
                .hasMore(false)
                .totalCount(entities.size())
                .build();
    }

    @Transactional
    public void resolveConflict(UUID businessId, String entityType, UUID entityId,
                                 Map<String, Object> resolvedData) {
        log.info("Resolving conflict for entity: {} id: {} in business: {}", entityType, entityId, businessId);

        List<SyncQueue> queueItems = syncQueueRepository
                .findByBusinessIdAndEntityTypeAndEntityIdAndOperation(businessId, entityType, entityId, "UPDATE");

        for (SyncQueue item : queueItems) {
            item.setStatus("RESOLVED");
            syncQueueRepository.save(item);
        }

        SyncLog syncLog = SyncLog.builder()
                .businessId(businessId)
                .entityType(entityType)
                .entityId(entityId)
                .operation(SyncOperation.UPDATE)
                .syncedAt(Instant.now())
                .status(SyncLog.SyncStatus.SYNCED)
                .conflictResolved(true)
                .build();

        try {
            syncLog.setPayload(objectMapper.writeValueAsString(resolvedData));
        } catch (JsonProcessingException e) {
            syncLog.setPayload(resolvedData.toString());
        }
        syncLogRepository.save(syncLog);

        auditService.logEvent(businessId.toString(), "RESOLVE_CONFLICT", entityType, entityId,
                null, Map.of("status", "resolved"));
    }

    @Transactional
    public void markSyncComplete(UUID businessId, String entityType, UUID entityId, String deviceId) {
        log.info("Marking sync complete for entity: {} id: {} device: {}", entityType, entityId, deviceId);

        List<SyncQueue> queueItems = syncQueueRepository
                .findByBusinessIdAndEntityTypeAndEntityIdAndOperation(businessId, entityType, entityId, "UPDATE");
        for (SyncQueue item : queueItems) {
            if (item.getDeviceId() != null && item.getDeviceId().equals(deviceId)) {
                item.setStatus("COMPLETED");
                item.setProcessedAt(Instant.now());
                syncQueueRepository.save(item);
            }
        }
    }

    @Transactional
    public void processSyncQueue() {
        log.info("Processing sync queue");

        List<SyncQueue> pendingItems = syncQueueRepository
                .findByStatusAndNextRetryAtBeforeOrNextRetryAtIsNull("PENDING", Instant.now());

        for (SyncQueue item : pendingItems) {
            try {
                item.setStatus("PROCESSING");
                syncQueueRepository.save(item);

                SyncPayload payload = SyncPayload.builder()
                        .entityType(item.getEntityType())
                        .entityId(item.getEntityId())
                        .operation(item.getOperation())
                        .deviceId(item.getDeviceId())
                        .build();

                if (item.getPayload() != null) {
                    try {
                        payload.setData(objectMapper.readValue(item.getPayload(), Map.class));
                    } catch (Exception e) {
                        payload.setData(item.getPayload());
                    }
                }

                SyncResult result = processSyncPayload(payload, item.getBusinessId());

                if (result.getStatus() == SyncStatus.SYNCED) {
                    item.setStatus("COMPLETED");
                    item.setProcessedAt(Instant.now());
                } else {
                    item.setStatus("FAILED");
                    item.setRetryCount(item.getRetryCount() + 1);
                    item.setNextRetryAt(Instant.now().plusSeconds(30L * item.getRetryCount()));
                    item.setErrorMessage(result.getErrorMessage());
                }
            } catch (Exception e) {
                log.error("Error processing sync queue item {}: {}", item.getId(), e.getMessage());
                item.setStatus("FAILED");
                item.setRetryCount(item.getRetryCount() + 1);
                item.setErrorMessage(e.getMessage());
                item.setNextRetryAt(Instant.now().plusSeconds(30L * item.getRetryCount()));
            }
            syncQueueRepository.save(item);
        }
    }

}
