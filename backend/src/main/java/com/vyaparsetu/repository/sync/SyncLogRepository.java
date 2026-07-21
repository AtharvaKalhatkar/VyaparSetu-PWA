package com.vyaparsetu.repository.sync;

import com.vyaparsetu.entity.sync.SyncLog;
import com.vyaparsetu.entity.sync.SyncLog.SyncStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface SyncLogRepository extends JpaRepository<SyncLog, UUID>, JpaSpecificationExecutor<SyncLog> {

    Page<SyncLog> findByBusinessIdAndEntityTypeAndStatus(
            UUID businessId, String entityType, SyncStatus status, Pageable pageable);

    List<SyncLog> findByDeviceIdAndStatus(String deviceId, SyncStatus status);

    Page<SyncLog> findByBusinessId(UUID businessId, Pageable pageable);

    Page<SyncLog> findByBusinessIdAndEntityType(UUID businessId, String entityType, Pageable pageable);
}
