package com.angadia.backend.controller;

import com.angadia.backend.dto.request.CreateTransactionRequest;
import com.angadia.backend.dto.response.ApiResponse;
import com.angadia.backend.dto.response.TransactionResponse;
import com.angadia.backend.security.CustomUserDetails;
import com.angadia.backend.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Tag(name = "Transactions", description = "Transaction entry, daybook")
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @Operation(summary = "Create a new transaction")
    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> create(
        @Valid @RequestBody CreateTransactionRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails,
        HttpServletRequest http
    ) {
        TransactionResponse response = transactionService.createTransaction(
            request, userDetails.getId(), userDetails.getUsername(), getIp(http), getAgent(http));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Transaction created"));
    }

    @Operation(summary = "Search transactions by date range")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> search(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(transactionService.searchTransactions(from, to, page, size)));
    }

    @Operation(summary = "Get daybook for a specific date")
    @GetMapping("/daybook")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getDaybook(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success(transactionService.getDaybook(targetDate)));
    }

    @Operation(summary = "Soft-delete a transaction (ADMIN only)")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
        @PathVariable String id,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal CustomUserDetails userDetails,
        HttpServletRequest http
    ) {
        transactionService.deleteTransaction(id, body.get("deleteReason"),
            userDetails.getId(), userDetails.getUsername(), getIp(http), getAgent(http));
        return ResponseEntity.ok(ApiResponse.success(null, "Transaction deleted"));
    }

    private String getIp(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        return (fwd != null && !fwd.isBlank()) ? fwd.split(",")[0].trim() : req.getRemoteAddr();
    }

    private String getAgent(HttpServletRequest req) { return req.getHeader("User-Agent"); }
}
