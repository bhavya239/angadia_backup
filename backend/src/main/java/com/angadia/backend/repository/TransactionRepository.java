package com.angadia.backend.repository;

import com.angadia.backend.domain.entity.Transaction;
import com.angadia.backend.domain.enums.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {

    Optional<Transaction> findByTxnNumber(String txnNumber);

    boolean existsByTxnNumber(String txnNumber);

    boolean existsBySenderId(String senderId);

    boolean existsByReceiverId(String receiverId);

    boolean existsBySenderIdOrReceiverId(String senderId, String receiverId);

    // Daybook: all active transactions for a date
    List<Transaction> findByTxnDateAndStatusOrderByCreatedAtAsc(LocalDate date, TransactionStatus status);

    // Ledger: transactions for a party (as sender OR receiver) up to a date
    @Query("{ 'status': 'ACTIVE', $or: [{'senderId': ?0}, {'receiverId': ?0}], 'txnDate': { $lte: ?1 } }")
    List<Transaction> findLedgerEntries(String partyId, LocalDate toDate);

    // Ledger within date range
    @Query("{ 'status': 'ACTIVE', $or: [{'senderId': ?0}, {'receiverId': ?0}], 'txnDate': { $gte: ?1, $lte: ?2 } }")
    List<Transaction> findLedgerEntriesInRange(String partyId, LocalDate fromDate, LocalDate toDate);

    // Search with pagination
    @Query("{ 'status': 'ACTIVE', 'txnDate': { $gte: ?0, $lte: ?1 } }")
    Page<Transaction> findByDateRange(LocalDate from, LocalDate to, Pageable pageable);

    // Today's count and amount (for dashboard)
    long countByTxnDateAndStatus(LocalDate date, TransactionStatus status);

    // Vatav: all active transactions in date range
    @Query("{ 'status': 'ACTIVE', 'txnDate': { $gte: ?0, $lte: ?1 } }")
    List<Transaction> findActiveByDateRange(LocalDate from, LocalDate to);

    // Global counts and sums
    long countByStatus(TransactionStatus status);

    record AggregationSum(BigDecimal total) {}

    @Aggregation(pipeline = { "{ $match: { status: 'ACTIVE' } }", "{ $group: { _id: null, total: { $sum: '$amount' } } }" })
    AggregationSum getSumTotalAmount();

    default BigDecimal sumTotalAmount() {
        AggregationSum res = getSumTotalAmount();
        return res != null && res.total() != null ? res.total() : BigDecimal.ZERO;
    }

    @Aggregation(pipeline = { "{ $match: { status: 'ACTIVE' } }", "{ $group: { _id: null, total: { $sum: '$vatavAmount' } } }" })
    AggregationSum getSumTotalVatav();

    default BigDecimal sumTotalVatav() {
        AggregationSum res = getSumTotalVatav();
        return res != null && res.total() != null ? res.total() : BigDecimal.ZERO;
    }

    @Aggregation(pipeline = { "{ $match: { status: 'ACTIVE', txnDate: { $lt: ?0 } } }", "{ $group: { _id: null, total: { $sum: '$vatavAmount' } } }" })
    AggregationSum getSumGlobalOpeningBalance(LocalDate date);

    default BigDecimal sumGlobalOpeningBalance(LocalDate date) {
        AggregationSum res = getSumGlobalOpeningBalance(date);
        return res != null && res.total() != null ? res.total() : BigDecimal.ZERO;
    }
}
