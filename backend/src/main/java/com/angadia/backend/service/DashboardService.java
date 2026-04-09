package com.angadia.backend.service;

import com.angadia.backend.domain.enums.TransactionStatus;
import com.angadia.backend.dto.response.DashboardResponse;
import com.angadia.backend.repository.PartyRepository;
import com.angadia.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PartyRepository partyRepository;
    private final TransactionRepository transactionRepository;

    public DashboardResponse getDashboardStats() {
        long totalParties = partyRepository.countByIsActiveTrue();
        long totalTransactions = transactionRepository.countByStatus(TransactionStatus.ACTIVE);
        long todayTransactions = transactionRepository.countByTxnDateAndStatus(LocalDate.now(), TransactionStatus.ACTIVE);
        
        BigDecimal totalAmount = transactionRepository.sumTotalAmount();
        BigDecimal totalVatav = transactionRepository.sumTotalVatav();

        return new DashboardResponse(
            totalParties,
            totalTransactions,
            todayTransactions,
            totalAmount != null ? totalAmount : BigDecimal.ZERO,
            totalVatav != null ? totalVatav : BigDecimal.ZERO
        );
    }
}
