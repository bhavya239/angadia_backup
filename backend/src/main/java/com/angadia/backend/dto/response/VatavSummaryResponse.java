package com.angadia.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VatavSummaryResponse(
    LocalDate fromDate,
    LocalDate toDate,
    long transactionCount,
    BigDecimal totalVolume,
    BigDecimal totalVatavEarned
) {}
