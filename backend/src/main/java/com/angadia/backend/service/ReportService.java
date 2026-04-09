package com.angadia.backend.service;

import com.angadia.backend.domain.entity.Party;
import com.angadia.backend.domain.entity.Transaction;
import com.angadia.backend.domain.enums.BalanceType;
import com.angadia.backend.dto.response.TrialBalanceResponse;
import com.angadia.backend.dto.response.VatavSummaryResponse;
import com.angadia.backend.repository.PartyRepository;
import com.angadia.backend.repository.TransactionRepository;
import com.angadia.backend.util.FinancialYearUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final PartyRepository partyRepository;

    public VatavSummaryResponse getVatavSummary(LocalDate from, LocalDate to) {
        List<Transaction> txns = transactionRepository.findActiveByDateRange(from, to);
        BigDecimal sum = txns.stream().map(Transaction::getVatavAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal vol = txns.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        return new VatavSummaryResponse(from, to, txns.size(), vol, sum);
    }

    public TrialBalanceResponse getTrialBalance(LocalDate date) {
        LocalDate financialYearStart = FinancialYearUtil.getFinancialYearStart(date);
        String yearString = FinancialYearUtil.getFinancialYear(date);

        List<Party> parties = partyRepository.findAll().stream().filter(Party::isActive).toList();
        List<TrialBalanceResponse.TrialBalanceEntry> entries = new ArrayList<>();

        BigDecimal grandDr = BigDecimal.ZERO;
        BigDecimal grandCr = BigDecimal.ZERO;

        // Note: For extreme datasets, this is better done natively via MongoDB Aggregation Pipelines.
        for(Party party : parties) {
            var ledger = transactionService.getLedger(party.getId(), financialYearStart, date);
            
            BigDecimal netBalance = ledger.closingBalance();
            BalanceType netType = ledger.closingBalanceType();

            BigDecimal dr = netType == BalanceType.DR ? netBalance : BigDecimal.ZERO;
            BigDecimal cr = netType == BalanceType.CR ? netBalance : BigDecimal.ZERO;

            grandDr = grandDr.add(dr);
            grandCr = grandCr.add(cr);

            entries.add(new TrialBalanceResponse.TrialBalanceEntry(
                party.getId(), party.getName(), party.getPartyCode(), party.getCityName(),
                dr, cr, netBalance
            ));
        }

        BigDecimal netDifference = grandDr.subtract(grandCr).abs();

        return new TrialBalanceResponse(yearString, entries, grandDr, grandCr, netDifference);
    }
}
