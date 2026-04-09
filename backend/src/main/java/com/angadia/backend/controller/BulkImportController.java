package com.angadia.backend.controller;

import com.angadia.backend.dto.request.BulkImportRowRequest;
import com.angadia.backend.dto.response.ApiResponse;
import com.angadia.backend.dto.response.BulkImportResponse;
import com.angadia.backend.dto.response.ParsedRowResponse;
import com.angadia.backend.security.CustomUserDetails;
import com.angadia.backend.service.BulkImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "Bulk Import", description = "Excel bulk transaction import")
@RestController
@RequestMapping("/api/v1/transactions/bulk-import")
@RequiredArgsConstructor
public class BulkImportController {

    private final BulkImportService bulkImportService;

    /**
     * STEP 1 — Upload & preview.
     * Parses the Excel file, validates each row, and returns parsed rows
     * (with validation errors) without saving anything.
     */
    @Operation(summary = "Parse Excel and return preview rows with validation status")
    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<List<ParsedRowResponse>>> preview(
        @RequestParam("file") MultipartFile file
    ) throws Exception {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Uploaded file is empty"));
        }
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Only .xlsx / .xls files are accepted"));
        }

        List<ParsedRowResponse> rows = bulkImportService.parseAndValidate(file);
        return ResponseEntity.ok(ApiResponse.success(rows, "Preview ready — " + rows.size() + " rows parsed"));
    }

    /**
     * STEP 2 — Confirm & commit.
     * Receives only the valid rows that the user confirmed on the frontend
     * and creates transactions for each one.
     */
    @Operation(summary = "Commit confirmed rows as real transactions")
    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<BulkImportResponse>> confirm(
        @RequestBody List<BulkImportRowRequest> rows,
        @AuthenticationPrincipal CustomUserDetails userDetails,
        HttpServletRequest http
    ) {
        if (rows == null || rows.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("No rows provided to import"));
        }
        BulkImportResponse result = bulkImportService.commitImport(
            rows, userDetails.getId(), userDetails.getUsername(), getIp(http), getAgent(http));
        return ResponseEntity.ok(ApiResponse.success(result,
            result.successCount() + " transactions imported successfully"));
    }

    private String getIp(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        return (fwd != null && !fwd.isBlank()) ? fwd.split(",")[0].trim() : req.getRemoteAddr();
    }

    private String getAgent(HttpServletRequest req) { return req.getHeader("User-Agent"); }
}
