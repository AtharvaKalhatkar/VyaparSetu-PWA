package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.dto.ledger.LedgerEntryDto;
import com.vyaparsetu.dto.ledger.LedgerEntryRequest;
import com.vyaparsetu.dto.ledger.LedgerSummaryDto;
import com.vyaparsetu.service.ledger.LedgerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/ledger")
@RequiredArgsConstructor
@Slf4j
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<LedgerEntryDto>>> getEntriesByBusiness(
            @PathVariable UUID businessId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LedgerEntryDto> entries = ledgerService.getEntriesByBusiness(businessId, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    @GetMapping("/{entryId}")
    public ResponseEntity<ApiResponse<LedgerEntryDto>> getEntry(@PathVariable UUID businessId,
                                                                 @PathVariable UUID entryId) {
        var entries = ledgerService.getEntriesByBusiness(businessId, null, null,
                org.springframework.data.domain.PageRequest.of(0, 1));
        LedgerEntryDto entry = entries.getContent().stream()
                .filter(e -> e.getId().equals(entryId))
                .findFirst()
                .orElseThrow(() -> new com.vyaparsetu.common.ResourceNotFoundException("LedgerEntry", entryId));
        return ResponseEntity.ok(ApiResponse.success(entry));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LedgerEntryDto>> createEntry(@PathVariable UUID businessId,
                                                                    @Valid @RequestBody LedgerEntryRequest request) {
        LedgerEntryDto entry = ledgerService.createEntry(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Entry created", entry));
    }

    @PostMapping("/reverse/{entryId}")
    public ResponseEntity<ApiResponse<LedgerEntryDto>> reverseEntry(@PathVariable UUID businessId,
                                                                     @PathVariable UUID entryId,
                                                                     @RequestParam String reason) {
        LedgerEntryDto entry = ledgerService.reverseEntry(businessId, entryId, reason);
        return ResponseEntity.ok(ApiResponse.success("Entry reversed", entry));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<LedgerSummaryDto>> getLedgerSummary(
            @PathVariable UUID businessId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LedgerSummaryDto summary = ledgerService.getLedgerSummary(businessId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/outstanding")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOutstandingReport(
            @PathVariable UUID businessId) {
        Map<String, Object> report = ledgerService.getOutstandingReport(businessId);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
