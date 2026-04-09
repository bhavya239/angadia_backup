package com.angadia.backend.domain.entity;

import com.angadia.backend.domain.enums.BalanceType;
import com.angadia.backend.domain.enums.PartyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "parties")
@CompoundIndexes({
    @CompoundIndex(name = "name_active_idx", def = "{'name': 1, 'isActive': 1}"),
    @CompoundIndex(name = "city_active_idx", def = "{'cityId': 1, 'isActive': 1}")
})
public class Party {

    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String partyCode;  // e.g. AHM-0001

    private String name;

    private String cityId;
    private String cityName;   // Denormalized for query performance

    private String phone;
    private String email;   // Optional contact email
    private String address;

    private PartyType partyType;

    @Builder.Default
    private BigDecimal crRoi = BigDecimal.ZERO;  // Credit ROI % per annum

    @Builder.Default
    private BigDecimal drRoi = BigDecimal.ZERO;  // Debit ROI % per annum

    @Builder.Default
    private BigDecimal openingBalance = BigDecimal.ZERO;

    private BalanceType openingBalanceType;

    @Builder.Default
    private boolean isActive = true;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    private String createdBy;  // userId
}
