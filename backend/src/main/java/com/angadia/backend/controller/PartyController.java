package com.angadia.backend.controller;

import com.angadia.backend.dto.request.CreatePartyRequest;
import com.angadia.backend.dto.response.ApiResponse;
import com.angadia.backend.dto.response.LedgerResponse;
import com.angadia.backend.dto.response.PartyResponse;
import com.angadia.backend.security.CustomUserDetails;
import com.angadia.backend.service.PartyService;
import com.angadia.backend.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Tag(name = "Parties", description = "Party management — CRUD and ledger")
@RestController
@RequestMapping("/api/v1/parties")
@RequiredArgsConstructor
public class PartyController {

    private final PartyService partyService;
    private final TransactionService transactionService;

    @Operation(summary = "Create a new party")
    @PostMapping
    public ResponseEntity<ApiResponse<PartyResponse>> create(
        @Valid @RequestBody CreatePartyRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails,
        HttpServletRequest http
    ) {
        PartyResponse response = partyService.createParty(request, userDetails.getId(), userDetails.getUsername(),
            getIp(http), getAgent(http));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Party created"));
    }

    @Operation(summary = "Search/list parties with pagination")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PartyResponse>>> search(
        @RequestParam(required = false) String term,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(partyService.searchParties(term, page, size)));
    }

    @Operation(summary = "Get party by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PartyResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(partyService.getParty(id)));
    }

    @Operation(summary = "Delete party")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteParty(@PathVariable String id) {
        partyService.deleteParty(id);
        return ResponseEntity.ok("Party deleted successfully");
    }

    @Operation(summary = "Update party")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PartyResponse>> update(
        @PathVariable String id,
        @Valid @RequestBody CreatePartyRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails,
        HttpServletRequest http
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            partyService.updateParty(id, request, userDetails.getId(), userDetails.getUsername(), getIp(http), getAgent(http)),
            "Party updated"
        ));
    }

    @Operation(summary = "Get ledger for a party")
    @GetMapping("/{id}/ledger")
    public ResponseEntity<ApiResponse<LedgerResponse>> getLedger(
        @PathVariable String id,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(ApiResponse.success(transactionService.getLedger(id, from, to)));
    }

    @Operation(summary = "Check if party code exists")
    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<Boolean>> checkCodeExists(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(partyService.checkCodeExists(code)));
    }

    private String getIp(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        return (fwd != null && !fwd.isBlank()) ? fwd.split(",")[0].trim() : req.getRemoteAddr();
    }

    private String getAgent(HttpServletRequest req) {
        return req.getHeader("User-Agent");
    }
}
