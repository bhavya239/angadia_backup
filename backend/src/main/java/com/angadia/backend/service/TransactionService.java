package com.angadia.backend.service;

import com.angadia.backend.domain.entity.Party;
import com.angadia.backend.domain.entity.Transaction;
import com.angadia.backend.domain.enums.AuditAction;
import com.angadia.backend.domain.enums.BalanceType;
import com.angadia.backend.domain.enums.TransactionStatus;
import com.angadia.backend.dto.request.CreateTransactionRequest;
import com.angadia.backend.dto.response.LedgerResponse;
import com.angadia.backend.dto.response.TransactionResponse;
import com.angadia.backend.exception.BusinessRuleException;
import com.angadia.backend.exception.EntityNotFoundException;
import com.angadia.backend.repository.PartyRepository;
import com.angadia.backend.repository.TransactionRepository;
import com.angadia.backend.repository.VatavRateRepository;
import com.angadia.backend.util.FinancialConstants;
import com.angadia.backend.util.SequenceGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final PartyRepository partyRepository;
    private final VatavRateRepository vatavRateRepository;
    private final SequenceGenerator sequenceGenerator;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    // ─── Create Transaction ────────────────────────────────────────────────────

    public TransactionResponse createTransaction(CreateTransactionRequest req,
                                                 String userId, String username,
                                                 String ipAddress, String userAgent) {
        if (req.senderId().equals(req.receiverId())) {
            throw new BusinessRuleException("Sender and receiver cannot be the same party");
        }

        Party sender   = findParty(req.senderId(), "Sender");
        Party receiver = findParty(req.receiverId(), "Receiver");

        BigDecimal vatavAmount = FinancialConstants.calculateVatav(req.amount(), req.vatavRate());
        String txnNumber       = sequenceGenerator.generateTxnNumber(req.txnDate());

        Transaction txn = Transaction.builder()
            .txnNumber(txnNumber)
            .txnDate(req.txnDate())
            .senderId(sender.getId())
            .senderName(sender.getName())
            .senderCity(sender.getCityName())
            .receiverId(receiver.getId())
            .receiverName(receiver.getName())
            .receiverCity(receiver.getCityName())
            .amount(req.amount())
            .vatavRate(req.vatavRate())
            .vatavAmount(vatavAmount)
            .narration(req.narration())
            .status(TransactionStatus.ACTIVE)
            .createdBy(userId)
            .build();

        Transaction saved = transactionRepository.save(txn);
        log.info("Transaction created: {} by {}", txnNumber, username);

        auditLogService.logAsync(userId, username, AuditAction.TRANSACTION_CREATED,
            "Transaction", saved.getId(), null, toJson(saved), ipAddress, userAgent);

        return toResponse(saved);
    }

    // ─── Soft Delete ──────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteTransaction(String id, String deleteReason,
                                  String userId, String username,
                                  String ipAddress, String userAgent) {
        Transaction txn = transactionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Transaction not found: " + id));

        if (txn.getStatus() == TransactionStatus.DELETED) {
            throw new BusinessRuleException("Transaction is already deleted");
        }
        if (deleteReason == null || deleteReason.isBlank()) {
            throw new BusinessRuleException("Delete reason is mandatory");
        }

        String oldJson = toJson(txn);
        txn.setStatus(TransactionStatus.DELETED);
        txn.setDeletedAt(Instant.now());
        txn.setDeletedBy(userId);
        txn.setDeleteReason(deleteReason.trim());
        transactionRepository.save(txn);

        auditLogService.logAsync(userId, username, AuditAction.TRANSACTION_DELETED,
            "Transaction", id, oldJson, toJson(txn), ipAddress, userAgent);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void restoreTransaction(String id, String userId, String username, String ipAddress, String userAgent) {
        Transaction txn = transactionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Transaction not found: " + id));

        if (txn.getStatus() == TransactionStatus.ACTIVE) {
            throw new BusinessRuleException("Transaction is already active");
        }

        String oldJson = toJson(txn);
        txn.setStatus(TransactionStatus.ACTIVE);
        txn.setDeletedAt(null);
        txn.setDeletedBy(null);
        txn.setDeleteReason(null);
        transactionRepository.save(txn);

        auditLogService.logAsync(userId, username, AuditAction.TRANSACTION_CREATED, // or RESTORED
            "Transaction", id, oldJson, toJson(txn), ipAddress, userAgent);
    }

    // ─── Daybook ─────────────────────────────────────────────────────────────

    public List<TransactionResponse> getDaybook(LocalDate date) {
        return transactionRepository
            .findByTxnDateAndStatusOrderByCreatedAtAsc(date, TransactionStatus.ACTIVE)
            .stream().map(this::toResponse).toList();
    }

    // ─── Search ──────────────────────────────────────────────────────────────

    public Page<TransactionResponse> searchTransactions(LocalDate from, LocalDate to, int page, int size) {
        LocalDate effectiveFrom = from != null ? from : LocalDate.now().withDayOfYear(1);
        LocalDate effectiveTo   = to   != null ? to   : LocalDate.now();
        Pageable pageable = PageRequest.of(page, size, Sort.by("txnDate").descending());
        return transactionRepository.findByDateRange(effectiveFrom, effectiveTo, pageable)
            .map(this::toResponse);
    }

    // ─── Ledger Engine ───────────────────────────────────────────────────────

    /**
     * Core ledger algorithm — computes running balance in strict date+createdAt order.
     * NEVER parallelise this — order determines correctness.
     */
    public LedgerResponse getLedger(String partyId, LocalDate from, LocalDate to) {
        Party party = findParty(partyId, "Party");

        // 1. Get ALL active transactions up to 'to' date for running balance context
        List<Transaction> allTxns = transactionRepository.findLedgerEntries(partyId, to);

        // 2. Sort strictly: date ASC, then createdAt ASC
        allTxns.sort(Comparator.comparing(Transaction::getTxnDate)
            .thenComparing(Transaction::getCreatedAt));

        // 3. Opening balance baseline
        BigDecimal runningBalance       = party.getOpeningBalance() != null ? party.getOpeningBalance() : BigDecimal.ZERO;
        BalanceType runningBalanceType  = party.getOpeningBalanceType() != null ? party.getOpeningBalanceType() : BalanceType.CR;

        // Convert to signed: CR = positive, DR = negative
        BigDecimal signedBalance = toSigned(runningBalance, runningBalanceType);

        BigDecimal totalDr = BigDecimal.ZERO;
        BigDecimal totalCr = BigDecimal.ZERO;
        List<LedgerResponse.LedgerEntry> entries = new ArrayList<>();

        for (Transaction txn : allTxns) {
            BigDecimal dr = BigDecimal.ZERO;
            BigDecimal cr = BigDecimal.ZERO;

            if (partyId.equals(txn.getSenderId())) {
                // Money goes OUT — DR for this party
                dr = txn.getAmount();
                signedBalance = signedBalance.subtract(txn.getAmount());
            } else if (partyId.equals(txn.getReceiverId())) {
                // Money comes IN — CR for this party
                cr = txn.getAmount();
                signedBalance = signedBalance.add(txn.getAmount());
            }

            // Only include in display entries if within [from, to]
            if (!txn.getTxnDate().isBefore(from)) {
                totalDr = totalDr.add(dr);
                totalCr = totalCr.add(cr);

                String particulars = partyId.equals(txn.getSenderId())
                    ? txn.getReceiverName() + " (" + txn.getReceiverCity() + ")"
                    : txn.getSenderName()   + " (" + txn.getSenderCity()   + ")";

                BalanceType balType = signedBalance.compareTo(BigDecimal.ZERO) >= 0 ? BalanceType.CR : BalanceType.DR;

                entries.add(new LedgerResponse.LedgerEntry(
                    txn.getTxnDate(),
                    txn.getTxnNumber(),
                    particulars,
                    dr,
                    cr,
                    signedBalance.abs(),
                    balType
                ));
            }
        }

        BalanceType closingType = signedBalance.compareTo(BigDecimal.ZERO) >= 0 ? BalanceType.CR : BalanceType.DR;

        return new LedgerResponse(
            party.getId(), party.getName(), party.getPartyCode(), party.getCityName(),
            from, to,
            party.getOpeningBalance(), party.getOpeningBalanceType(),
            entries,
            totalDr, totalCr,
            signedBalance.abs(), closingType
        );
    }

    // ─── Dashboard stats ─────────────────────────────────────────────────────

    public long getTodayTransactionCount() {
        return transactionRepository.countByTxnDateAndStatus(LocalDate.now(), TransactionStatus.ACTIVE);
    }

    public BigDecimal getTodayTotalAmount() {
        return getDaybook(LocalDate.now()).stream()
            .map(t -> t.amount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getTodayVatavTotal() {
        return getDaybook(LocalDate.now()).stream()
            .map(t -> t.vatavAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private BigDecimal toSigned(BigDecimal amount, BalanceType type) {
        return type == BalanceType.CR ? amount : amount.negate();
    }

    private Party findParty(String id, String label) {
        Party p = partyRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException(label + " party not found: " + id));
        if (!p.isActive()) throw new BusinessRuleException(label + " party is inactive");
        return p;
    }

    private TransactionResponse toResponse(Transaction t) {
        return new TransactionResponse(
            t.getId(), t.getTxnNumber(), t.getTxnDate(),
            t.getSenderId(), t.getSenderName(), t.getSenderCity(),
            t.getReceiverId(), t.getReceiverName(), t.getReceiverCity(),
            t.getAmount(), t.getVatavRate(), t.getVatavAmount(),
            t.getNarration(), t.getStatus(), t.getDeleteReason(),
            t.getDeletedAt(), t.getCreatedAt(), t.getCreatedBy()
        );
    }

    private String toJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); }
        catch (Exception e) { return "{}"; }
    }
}
