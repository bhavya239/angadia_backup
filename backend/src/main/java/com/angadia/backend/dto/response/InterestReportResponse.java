package com.angadia.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record InterestReportResponse(
    LocalDate fromDate,
    LocalDate toDate,
    List<InterestEntry> entries,
    BigDecimal totalInterestPayable,
    BigDecimal totalInterestReceivable
) {
    public record InterestEntry(
        String partyId,
        String partyName,
        String partyCode,
        BigDecimal crRoi,
        BigDecimal drRoi,
        BigDecimal interestEarned,
        BigDecimal interestCharged,
        BigDecimal netInterest
    ) {}
}
