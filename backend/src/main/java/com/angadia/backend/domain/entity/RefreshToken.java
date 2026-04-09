package com.angadia.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "refresh_tokens")
public class RefreshToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String tokenHash;    // SHA-256 hash — never store raw token

    @Indexed
    private String userId;

    @Indexed(expireAfterSeconds = 0)  // TTL index — MongoDB auto-deletes on expiresAt
    private Instant expiresAt;

    private Instant createdAt;

    @Builder.Default
    private boolean isRevoked = false;
}
