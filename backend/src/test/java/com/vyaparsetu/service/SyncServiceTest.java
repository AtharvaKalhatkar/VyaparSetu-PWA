package com.vyaparsetu.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.dto.sync.*;
import com.vyaparsetu.dto.sync.SyncResult.SyncStatus;
import com.vyaparsetu.entity.sync.SyncLog;
import com.vyaparsetu.entity.sync.SyncQueue;
import com.vyaparsetu.repository.sync.SyncLogRepository;
import com.vyaparsetu.repository.sync.SyncQueueRepository;
import com.vyaparsetu.service.sync.SyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SyncServiceTest {

    @Mock
    private SyncQueueRepository syncQueueRepository;
    @Mock
    private SyncLogRepository syncLogRepository;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private SyncService syncService;

    private UUID businessId;
    private UUID entityId;
    private UUID batchId;
    private SyncPayload createPayload;
    private SyncPayload updatePayload;
    private SyncBatchRequest batchRequest;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        entityId = UUID.randomUUID();
        batchId = UUID.randomUUID();

        createPayload = SyncPayload.builder()
                .entityType("Party")
                .entityId(entityId)
                .operation("CREATE")
                .data(Map.of("name", "Test Party"))
                .deviceId("device-001")
                .build();

        updatePayload = SyncPayload.builder()
                .entityType("Party")
                .entityId(entityId)
                .operation("UPDATE")
                .data(Map.of("name", "Updated Party"))
                .deviceId("device-001")
                .build();

        batchRequest = SyncBatchRequest.builder()
                .batchId(batchId)
                .businessId(businessId)
                .deviceId("device-001")
                .payloads(List.of(createPayload, updatePayload))
                .build();
    }

    @Test
    @DisplayName("processSyncPayload should return SYNCED status for CREATE operation")
    void processSyncPayload_shouldReturnSynced_forCreate() throws JsonProcessingException {
        when(syncQueueRepository.findByBusinessIdAndEntityTypeAndEntityIdAndOperation(
                any(), anyString(), any(), anyString())).thenReturn(List.of());
        when(objectMapper.writeValueAsString(any())).thenReturn("{\"name\":\"Test Party\"}");
        when(syncQueueRepository.save(any(SyncQueue.class))).thenReturn(mock(SyncQueue.class));
        when(syncLogRepository.save(any(SyncLog.class))).thenReturn(mock(SyncLog.class));
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        SyncResult result = syncService.processSyncPayload(createPayload);

        assertThat(result.getStatus()).isEqualTo(SyncStatus.SYNCED);
        assertThat(result.getEntityId()).isEqualTo(entityId);

        verify(syncQueueRepository).save(any(SyncQueue.class));
        verify(syncLogRepository).save(any(SyncLog.class));
        verify(auditService).logEvent(anyString(), eq("SYNC_CREATE"), anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("processSyncPayload should return SYNCED for UPDATE operation with matching version")
    void processSyncPayload_shouldReturnSynced_forUpdate() throws JsonProcessingException {
        when(syncQueueRepository.findByBusinessIdAndEntityTypeAndEntityIdAndOperation(
                any(), anyString(), any(), anyString())).thenReturn(List.of());
        when(objectMapper.writeValueAsString(any())).thenReturn("{\"name\":\"Updated Party\"}");
        when(syncQueueRepository.save(any(SyncQueue.class))).thenReturn(mock(SyncQueue.class));
        when(syncLogRepository.save(any(SyncLog.class))).thenReturn(mock(SyncLog.class));
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        SyncResult result = syncService.processSyncPayload(updatePayload);

        assertThat(result.getStatus()).isEqualTo(SyncStatus.SYNCED);
        verify(syncQueueRepository).save(any(SyncQueue.class));
    }

    @Test
    @DisplayName("processSyncPayload should return FAILED when max retries exceeded")
    void processSyncPayload_shouldReturnFailed_whenMaxRetriesExceeded() {
        SyncQueue existingQueue = SyncQueue.builder()
                .entityId(entityId)
                .retryCount(5)
                .maxRetries(5)
                .build();

        when(syncQueueRepository.findByBusinessIdAndEntityTypeAndEntityIdAndOperation(
                any(), anyString(), any(), anyString()))
                .thenReturn(List.of(existingQueue));

        SyncResult result = syncService.processSyncPayload(createPayload);

        assertThat(result.getStatus()).isEqualTo(SyncStatus.FAILED);
        assertThat(result.getErrorMessage()).contains("Max retries");

        verify(syncQueueRepository, never()).save(any(SyncQueue.class));
    }

    @Test
    @DisplayName("processSyncPayload should handle JsonProcessingException gracefully")
    void processSyncPayload_shouldHandleJsonException() throws JsonProcessingException {
        when(syncQueueRepository.findByBusinessIdAndEntityTypeAndEntityIdAndOperation(
                any(), anyString(), any(), anyString())).thenReturn(List.of());
        when(objectMapper.writeValueAsString(any()))
                .thenThrow(new JsonProcessingException("Serialization error") {});

        SyncResult result = syncService.processSyncPayload(createPayload);

        assertThat(result.getStatus()).isEqualTo(SyncStatus.FAILED);
        assertThat(result.getErrorMessage()).contains("Failed to serialize");
    }

    @Test
    @DisplayName("processSyncBatch should process multiple payloads and return results")
    void processSyncBatch_shouldReturnBatchResponse() throws JsonProcessingException {
        when(syncQueueRepository.findByBusinessIdAndEntityTypeAndEntityIdAndOperation(
                any(), anyString(), any(), anyString())).thenReturn(List.of());
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(syncQueueRepository.save(any(SyncQueue.class))).thenReturn(mock(SyncQueue.class));
        when(syncLogRepository.save(any(SyncLog.class))).thenReturn(mock(SyncLog.class));
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        SyncBatchResponse response = syncService.processSyncBatch(batchRequest);

        assertThat(response.getBatchId()).isEqualTo(batchId);
        assertThat(response.getResults()).hasSize(2);
        assertThat(response.getResults()).allMatch(r -> r.getStatus() == SyncStatus.SYNCED);
    }

    @Test
    @DisplayName("processSyncBatch should return FAILED for individual payload errors")
    void processSyncBatch_shouldHandlePartialFailure() throws JsonProcessingException {
        when(syncQueueRepository.findByBusinessIdAndEntityTypeAndEntityIdAndOperation(
                any(), anyString(), any(), eq("CREATE"))).thenReturn(List.of());

        SyncQueue maxedOutQueue = SyncQueue.builder()
                .retryCount(5)
                .maxRetries(5)
                .build();

        when(syncQueueRepository.findByBusinessIdAndEntityTypeAndEntityIdAndOperation(
                any(), anyString(), any(), eq("UPDATE")))
                .thenReturn(List.of(maxedOutQueue));

        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(syncQueueRepository.save(any(SyncQueue.class))).thenReturn(mock(SyncQueue.class));
        when(syncLogRepository.save(any(SyncLog.class))).thenReturn(mock(SyncLog.class));
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        SyncBatchResponse response = syncService.processSyncBatch(batchRequest);

        assertThat(response.getResults()).hasSize(2);
        assertThat(response.getResults().get(0).getStatus()).isEqualTo(SyncStatus.SYNCED);
        assertThat(response.getResults().get(1).getStatus()).isEqualTo(SyncStatus.FAILED);
    }
}
