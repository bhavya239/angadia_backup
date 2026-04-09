package com.angadia.backend.repository;

import com.angadia.backend.domain.entity.AuditLog;
import com.angadia.backend.domain.enums.AuditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    Page<AuditLog> findByEntityTypeAndEntityId(String entityType, String entityId, Pageable pageable);
    Page<AuditLog> findByUserId(String userId, Pageable pageable);
    Page<AuditLog> findByAction(AuditAction action, Pageable pageable);
    Page<AuditLog> findByTimestampBetween(Instant from, Instant to, Pageable pageable);
}
