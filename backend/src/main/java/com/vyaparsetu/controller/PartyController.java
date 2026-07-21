package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.dto.party.PartyBalanceDto;
import com.vyaparsetu.dto.party.PartyCreateRequest;
import com.vyaparsetu.dto.party.PartyDto;
import com.vyaparsetu.dto.party.PartyLedgerDto;
import com.vyaparsetu.dto.party.PartyUpdateRequest;
import com.vyaparsetu.service.party.PartyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/parties")
@RequiredArgsConstructor
@Slf4j
public class PartyController {

    private final PartyService partyService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<PartyDto>>> getParties(
            @PathVariable UUID businessId,
            @RequestParam(required = false) String type,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<PartyDto> parties = partyService.getPartiesByBusiness(businessId, type, pageable);
        return ResponseEntity.ok(ApiResponse.success(parties));
    }

    @GetMapping("/{partyId}")
    public ResponseEntity<ApiResponse<PartyDto>> getPartyById(@PathVariable UUID businessId,
                                                               @PathVariable UUID partyId) {
        PartyDto party = partyService.getPartyById(businessId, partyId);
        return ResponseEntity.ok(ApiResponse.success(party));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PartyDto>> createParty(@PathVariable UUID businessId,
                                                              @Valid @RequestBody PartyCreateRequest request) {
        PartyDto party = partyService.createParty(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Party created", party));
    }

    @PutMapping("/{partyId}")
    public ResponseEntity<ApiResponse<PartyDto>> updateParty(@PathVariable UUID businessId,
                                                              @PathVariable UUID partyId,
                                                              @Valid @RequestBody PartyUpdateRequest request) {
        PartyDto party = partyService.updateParty(businessId, partyId, request);
        return ResponseEntity.ok(ApiResponse.success("Party updated", party));
    }

    @DeleteMapping("/{partyId}")
    public ResponseEntity<ApiResponse<Void>> deleteParty(@PathVariable UUID businessId,
                                                         @PathVariable UUID partyId) {
        partyService.deleteParty(businessId, partyId);
        return ResponseEntity.ok(ApiResponse.success("Party deleted", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PagedResponse<PartyDto>>> searchParties(
            @PathVariable UUID businessId,
            @RequestParam String query,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<PartyDto> parties = partyService.searchParties(businessId, query, pageable);
        return ResponseEntity.ok(ApiResponse.success(parties));
    }

    @GetMapping("/outstanding")
    public ResponseEntity<ApiResponse<List<PartyBalanceDto>>> getOutstandingParties(
            @PathVariable UUID businessId) {
        List<PartyBalanceDto> outstanding = partyService.getOutstandingParties(businessId);
        return ResponseEntity.ok(ApiResponse.success(outstanding));
    }

    @GetMapping("/{partyId}/ledger")
    public ResponseEntity<ApiResponse<PartyLedgerDto>> getPartyLedger(
            @PathVariable UUID businessId,
            @PathVariable UUID partyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        PartyLedgerDto ledger = partyService.getPartyLedger(businessId, partyId, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(ledger));
    }

    @GetMapping("/{partyId}/balance")
    public ResponseEntity<ApiResponse<PartyBalanceDto>> getPartyBalance(@PathVariable UUID businessId,
                                                                         @PathVariable UUID partyId) {
        PartyBalanceDto balance = partyService.getPartyBalance(businessId, partyId);
        return ResponseEntity.ok(ApiResponse.success(balance));
    }

    @PostMapping("/import")
    public ResponseEntity<ApiResponse<List<PartyDto>>> importParties(@PathVariable UUID businessId,
                                                                      @RequestParam("file") MultipartFile file) {
        List<PartyDto> imported = partyService.importParties(businessId, file);
        return ResponseEntity.ok(ApiResponse.success("Parties imported", imported));
    }
}
