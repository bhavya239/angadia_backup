package com.angadia.backend.controller;

import com.angadia.backend.dto.response.ApiResponse;
import com.angadia.backend.dto.response.InterestReportResponse;
import com.angadia.backend.dto.response.TrialBalanceResponse;
import com.angadia.backend.dto.response.VatavSummaryResponse;
import com.angadia.backend.service.InterestCalculationService;
import com.angadia.backend.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@Tag(name = "Reports", description = "Financial Reports: Trial Balance, Interest, Vatav")
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final InterestCalculationService interestCalculationService;

    @Operation(summary = "Get aggregate Vatav summary over a date range")
    @GetMapping("/vatav")
    public ResponseEntity<ApiResponse<VatavSummaryResponse>> getVatavSummary(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getVatavSummary(from, to)));
    }

    @Operation(summary = "Get system-wide Trial Balance up to a specific date")
    @GetMapping("/trial-balance")
    public ResponseEntity<ApiResponse<TrialBalanceResponse>> getTrialBalance(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getTrialBalance(date)));
    }

    @Operation(summary = "Calculate dynamic interest (CR/DR) over a date range")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/interest")
    public ResponseEntity<ApiResponse<InterestReportResponse>> getInterestReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(ApiResponse.success(interestCalculationService.calculateSystemInterest(from, to)));
    }
}
