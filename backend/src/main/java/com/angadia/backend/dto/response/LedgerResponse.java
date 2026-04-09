package com.angadia.backend.dto.response;

import com.angadia.backend.domain.enums.BalanceType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record LedgerResponse(
    String partyId,
    String partyName,
    String partyCode,
    String cityName,
    LocalDate fromDate,
    LocalDate toDate,
    BigDecimal openingBalance,
    BalanceType openingBalanceType,
    List<LedgerEntry> entries,
    BigDecimal totalDr,
    BigDecimal totalCr,
    BigDecimal closingBalance,
    BalanceType closingBalanceType
) {
    public record LedgerEntry(
        LocalDate date,
        String txnNumber,
        String particulars,
        BigDecimal drAmount,
        BigDecimal crAmount,
        BigDecimal runningBalance,
        BalanceType balanceType
    ) {}
}
