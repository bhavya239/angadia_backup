package com.angadia.backend.service;

import com.angadia.backend.domain.entity.Party;
import com.angadia.backend.domain.enums.BalanceType;
import com.angadia.backend.dto.response.InterestReportResponse;
import com.angadia.backend.dto.response.LedgerResponse;
import com.angadia.backend.repository.PartyRepository;
import com.angadia.backend.util.FinancialConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InterestCalculationService {

    private final PartyRepository partyRepository;
    private final TransactionService transactionService;

    /**
     * Calculates day-wise interest for all active parties over a date range.
     * CR ROI applies to positive (Credit) balances.
     * DR ROI applies to negative (Debit) balances.
     */
    public InterestReportResponse calculateSystemInterest(LocalDate from, LocalDate to) {
        List<Party> parties = partyRepository.findAll().stream().filter(Party::isActive).toList();
        List<InterestReportResponse.InterestEntry> entries = new ArrayList<>();

        BigDecimal totalPayable = BigDecimal.ZERO;
        BigDecimal totalReceivable = BigDecimal.ZERO;

        for (Party party : parties) {
            BigDecimal interestEarned = BigDecimal.ZERO;  // We owe them (Payable)
            BigDecimal interestCharged = BigDecimal.ZERO; // They owe us (Receivable)

            // Skip computation if both ROIs are zero
            if (party.getCrRoi().compareTo(BigDecimal.ZERO) == 0 && party.getDrRoi().compareTo(BigDecimal.ZERO) == 0) continue;

            LedgerResponse ledger = transactionService.getLedger(party.getId(), from, to);

            // Need to calculate day-by-day running balance
            BigDecimal currentBalance = ledger.openingBalance();
            BalanceType currentType = ledger.openingBalanceType();
            BigDecimal signedBalance = currentType == BalanceType.CR ? currentBalance : currentBalance.negate();

            LocalDate currentDate = from;
            int ledgerEntryIndex = 0;
            List<LedgerResponse.LedgerEntry> periodEntries = ledger.entries();

            while (!currentDate.isAfter(to)) {
                
                // Process any transactions that occurred exactly on currentDate
                while (ledgerEntryIndex < periodEntries.size() && 
                       !periodEntries.get(ledgerEntryIndex).date().isAfter(currentDate)) {
                    
                    LedgerResponse.LedgerEntry entry = periodEntries.get(ledgerEntryIndex);
                    
                    // We only want to apply the balance shift on the exact day
                    if (entry.date().isEqual(currentDate)) {
                        signedBalance = signedBalance.add(entry.crAmount()).subtract(entry.drAmount());
                    }
                    ledgerEntryIndex++;
                }

                // Apply interest on end-of-day signed balance
                if (signedBalance.compareTo(BigDecimal.ZERO) > 0) {
                    if (party.getCrRoi().compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal dailyCr = FinancialConstants.calculateInterest(signedBalance, party.getCrRoi(), 1);
                        interestEarned = interestEarned.add(dailyCr);
                    }
                } else if (signedBalance.compareTo(BigDecimal.ZERO) < 0) {
                     if (party.getDrRoi().compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal dailyDr = FinancialConstants.calculateInterest(signedBalance.abs(), party.getDrRoi(), 1);
                        interestCharged = interestCharged.add(dailyDr);
                    }
                }

                currentDate = currentDate.plusDays(1);
            }

            // Round final amounts
            interestEarned = FinancialConstants.round(interestEarned);
            interestCharged = FinancialConstants.round(interestCharged);
            BigDecimal netInterest = interestEarned.subtract(interestCharged);

            totalPayable = totalPayable.add(interestEarned);
            totalReceivable = totalReceivable.add(interestCharged);

            entries.add(new InterestReportResponse.InterestEntry(
                party.getId(), party.getName(), party.getPartyCode(),
                party.getCrRoi(), party.getDrRoi(),
                interestEarned, interestCharged, netInterest
            ));
        }

        return new InterestReportResponse(from, to, entries, totalPayable, totalReceivable);
    }
}
