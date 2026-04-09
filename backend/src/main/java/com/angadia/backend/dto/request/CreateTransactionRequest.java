package com.angadia.backend.dto.request;

import com.angadia.backend.domain.enums.TransactionStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateTransactionRequest(
    @NotNull(message = "Transaction date is required")
    @PastOrPresent(message = "Transaction date cannot be in the future")
    LocalDate txnDate,

    @NotBlank(message = "Sender ID is required")
    String senderId,

    @NotBlank(message = "Receiver ID is required")
    String receiverId,

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 12, fraction = 2, message = "Invalid amount format")
    BigDecimal amount,

    @NotNull(message = "Vatav rate is required")
    @DecimalMin(value = "0.00")
    @DecimalMax(value = "100.00")
    @Digits(integer = 3, fraction = 4)
    BigDecimal vatavRate,

    @Size(max = 500)
    String narration
) {}
