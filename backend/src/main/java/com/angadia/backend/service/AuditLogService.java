package com.angadia.backend.service;

import com.angadia.backend.domain.entity.AuditLog;
import com.angadia.backend.domain.enums.AuditAction;
import com.angadia.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Async audit log write — never blocks the request thread.
     * Called after every mutation across the application.
     */
    @Async
    public void logAsync(String userId, String username, AuditAction action,
                         String entityType, String entityId,
                         String oldValue, String newValue,
                         String ipAddress, String userAgent) {
        try {
            AuditLog log = AuditLog.builder()
                .timestamp(Instant.now())
                .userId(userId)
                .username(username)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Audit log failure must NEVER propagate to break the main flow
            log.error("Failed to write audit log for action {}: {}", action, e.getMessage());
        }
    }
}
