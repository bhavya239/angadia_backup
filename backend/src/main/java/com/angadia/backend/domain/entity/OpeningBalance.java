package com.angadia.backend.domain.entity;

import com.angadia.backend.domain.enums.BalanceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "opening_balances")
@CompoundIndexes({
    @CompoundIndex(name = "party_year_idx", def = "{'partyId': 1, 'financialYear': 1}", unique = true)
})
public class OpeningBalance {

    @Id
    private String id;

    private String partyId;
    private String partyName;      // Denormalized

    private LocalDate balanceDate;

    private BigDecimal amount;
    private BalanceType balanceType;

    private String financialYear;  // e.g. "2024-25"

    @CreatedDate
    private Instant createdAt;

    private String createdBy;
}
