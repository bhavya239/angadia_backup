package com.angadia.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "vatav_rates")
public class VatavRate {

    @Id
    private String id;

    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;   // null = currently active

    private BigDecimal rate;         // % e.g. 0.25

    private String description;

    @CreatedDate
    private Instant createdAt;

    private String createdBy;
}
