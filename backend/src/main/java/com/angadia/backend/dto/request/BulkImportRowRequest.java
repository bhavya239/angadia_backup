package com.angadia.backend.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Represents one validated row submitted from the frontend bulk-import preview
 * (after the user reviews the parsed data and clicks "Confirm Import").
 */
public record BulkImportRowRequest(
    LocalDate txnDate,
    String senderName,   // Resolved to ID server-side
    BigDecimal sentAmount,
    String receiverName, // Resolved to ID server-side
    BigDecimal receivedAmount,
    BigDecimal vatav,
    String city,
    String remarks
) {}
