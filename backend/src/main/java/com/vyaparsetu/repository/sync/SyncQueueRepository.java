package com.vyaparsetu.repository.sync;

import com.vyaparsetu.entity.sync.SyncQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface SyncQueueRepository extends JpaRepository<SyncQueue, UUID>, JpaSpecificationExecutor<SyncQueue> {

    List<SyncQueue> findByBusinessIdAndStatus(UUID businessId, String status);

    List<SyncQueue> findByStatusAndNextRetryAtBeforeOrNextRetryAtIsNull(String status, Instant now);

    List<SyncQueue> findByBusinessIdAndEntityTypeAndEntityIdAndOperation(
            UUID businessId, String entityType, UUID entityId, String operation);

    long countByBusinessIdAndStatus(UUID businessId, String status);
}
