package com.angadia.backend.dto.response;

import com.angadia.backend.domain.enums.TransactionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record TransactionResponse(
    String id,
    String txnNumber,
    LocalDate txnDate,
    String senderId,
    String senderName,
    String senderCity,
    String receiverId,
    String receiverName,
    String receiverCity,
    BigDecimal amount,
    BigDecimal vatavRate,
    BigDecimal vatavAmount,
    String narration,
    TransactionStatus status,
    String deleteReason,
    Instant deletedAt,
    Instant createdAt,
    String createdBy
) {}
