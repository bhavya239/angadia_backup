package com.angadia.backend.dto.response;

import com.angadia.backend.domain.enums.BalanceType;
import com.angadia.backend.domain.enums.PartyType;

import java.math.BigDecimal;
import java.time.Instant;

public record PartyResponse(
    String id,
    String partyCode,
    String name,
    String cityId,
    String cityName,
    String phone,
    String email,
    String address,
    PartyType partyType,
    BigDecimal crRoi,
    BigDecimal drRoi,
    BigDecimal openingBalance,
    BalanceType openingBalanceType,
    boolean isActive,
    Instant createdAt,
    Instant updatedAt
) {}
