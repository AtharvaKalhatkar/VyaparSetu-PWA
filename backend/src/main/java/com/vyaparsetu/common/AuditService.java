package com.vyaparsetu.common;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vyaparsetu.entity.audit.AuditLog;
import com.vyaparsetu.repository.audit.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final ObjectMapper objectMapper;
    private final AuditLogRepository auditLogRepository;

    public void logEvent(UUID businessId, UUID actorId, String action, String entityType,
                          UUID entityId, String fieldName, Object oldValue, Object newValue,
                          String ipAddress, String userAgent) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .businessId(businessId)
                    .actorId(actorId)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .fieldName(fieldName)
                    .oldValue(oldValue != null ? objectMapper.writeValueAsString(oldValue) : null)
                    .newValue(newValue != null ? objectMapper.writeValueAsString(newValue) : null)
                    .ipAddress(ipAddress != null ? ipAddress : getClientIp())
                    .userAgent(userAgent)
                    .timestamp(Instant.now())
                    .build();
            auditLogRepository.save(auditLog);
            log.info("AUDIT: {} {} {} {} {} -> {}", actorId, action, entityType, entityId, oldValue, newValue);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize audit event: {}", e.getMessage());
        }
    }

    public void logEvent(String actorIdStr, String action, String entityType, UUID entityId,
                          Map<String, Object> oldValues, Map<String, Object> newValues) {
        try {
            AuditLog.AuditLogBuilder builder = AuditLog.builder()
                    .actorId(actorIdStr != null ? UUID.fromString(actorIdStr) : null)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .oldValue(oldValues != null ? objectMapper.writeValueAsString(oldValues) : null)
                    .newValue(newValues != null ? objectMapper.writeValueAsString(newValues) : null)
                    .ipAddress(getClientIp())
                    .userAgent(getUserAgent())
                    .timestamp(Instant.now());
            auditLogRepository.save(builder.build());
            log.info("AUDIT: {} {} {} {}", actorIdStr, action, entityType, entityId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize audit event: {}", e.getMessage());
        }
    }

    public void logEvent(UUID businessId, UUID actorId, String action, String entityType,
                          UUID entityId, Map<String, Object> oldValues, Map<String, Object> newValues) {
        logEvent(businessId, actorId, action, entityType, entityId, null,
                oldValues, newValues, null, null);
    }

    public Page<AuditLog> getAuditLogs(UUID businessId, String entityType, UUID entityId, Pageable pageable) {
        if (entityType != null && entityId != null) {
            return auditLogRepository.findByBusinessIdAndEntityTypeAndEntityId(
                    businessId, entityType, entityId, pageable);
        }
        return auditLogRepository.findByBusinessId(businessId, pageable);
    }

    private String getClientIp() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                return xForwardedFor.split(",")[0].trim();
            }
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isBlank()) {
                return xRealIp;
            }
            String remoteAddr = request.getRemoteAddr();
            if (remoteAddr != null) {
                return remoteAddr;
            }
        }
        return "UNKNOWN";
    }

    private String getUserAgent() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            return attributes.getRequest().getHeader("User-Agent");
        }
        return null;
    }
}
