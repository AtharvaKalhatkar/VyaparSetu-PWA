package com.vyaparsetu.repository.audit;

import com.vyaparsetu.entity.audit.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {

    Page<AuditLog> findByBusinessIdAndEntityTypeAndEntityId(
            UUID businessId, String entityType, UUID entityId, Pageable pageable);

    Page<AuditLog> findByBusinessIdAndActorId(UUID businessId, UUID actorId, Pageable pageable);

    Page<AuditLog> findByBusinessIdAndTimestampBetween(
            UUID businessId, Instant startDate, Instant endDate, Pageable pageable);

    Page<AuditLog> findByBusinessId(UUID businessId, Pageable pageable);
}
