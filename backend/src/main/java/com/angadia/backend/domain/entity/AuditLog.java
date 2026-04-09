package com.angadia.backend.domain.entity;

import com.angadia.backend.domain.enums.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "audit_logs")
@CompoundIndexes({
    @CompoundIndex(name = "entity_timestamp_idx",  def = "{'entityType': 1, 'entityId': 1, 'timestamp': -1}"),
    @CompoundIndex(name = "user_timestamp_idx",    def = "{'userId': 1, 'timestamp': -1}")
})
public class AuditLog {

    @Id
    private String id;

    // Retain logs for 7 years (220752000 seconds)
    @Indexed(expireAfterSeconds = 220752000)
    private Instant timestamp;

    private String userId;
    private String username;

    private AuditAction action;

    private String entityType;   // e.g. "Party", "Transaction"
    private String entityId;

    private String oldValue;     // JSON string of old state
    private String newValue;     // JSON string of new state

    private String ipAddress;
    private String userAgent;
}
