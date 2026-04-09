package com.angadia.backend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record TrialBalanceResponse(
    String financialYear,
    List<TrialBalanceEntry> entries,
    BigDecimal grandTotalDr,
    BigDecimal grandTotalCr,
    BigDecimal netDifference
) {
    public record TrialBalanceEntry(
        String partyId,
        String partyName,
        String partyCode,
        String cityName,
        BigDecimal totalDr,
        BigDecimal totalCr,
        BigDecimal netBalance
    ) {}
}
