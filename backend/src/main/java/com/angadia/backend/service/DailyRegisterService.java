package com.angadia.backend.service;

import com.angadia.backend.domain.entity.Transaction;
import com.angadia.backend.domain.enums.TransactionStatus;
import com.angadia.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DailyRegisterService {

    private final TransactionRepository transactionRepository;

    public BigDecimal getOpeningBalance(LocalDate date) {
        BigDecimal sum = transactionRepository.sumGlobalOpeningBalance(date);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    public List<Transaction> getDailyTransactions(LocalDate date) {
        return transactionRepository.findByTxnDateAndStatusOrderByCreatedAtAsc(date, TransactionStatus.ACTIVE);
    }
}
