package com.angadia.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Returned to the frontend so the user can preview rows before confirming.
 * Contains the resolved party IDs (when valid) and any validation errors for
 * rows that cannot be imported. Frontend uses valid=false rows to show inline
 * error highlighting before commit.
 */
public record ParsedRowResponse(
    int rowNumber,
    LocalDate txnDate,
    String senderName,
    String senderId,         // null if not found
    BigDecimal sentAmount,
    String receiverName,
    String receiverId,       // null if not found
    BigDecimal receivedAmount,
    BigDecimal vatav,
    String city,
    String remarks,
    boolean valid,
    List<String> errors
) {}
