package com.angadia.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "cities")
public class City {

    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String name;

    @Indexed(unique = true, sparse = true)
    private String code;

    private String district;

    private String state;

    @Builder.Default
    private boolean isActive = true;

    @CreatedDate
    private Instant createdAt;
}
