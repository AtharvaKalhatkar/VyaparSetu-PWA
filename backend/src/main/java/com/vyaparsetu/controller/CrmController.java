package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.dto.crm.CrmLeadCreateRequest;
import com.vyaparsetu.dto.crm.CrmLeadDto;
import com.vyaparsetu.dto.crm.FollowUpDto;
import com.vyaparsetu.dto.party.PartyCreateRequest;
import com.vyaparsetu.service.crm.CrmService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/crm")
@RequiredArgsConstructor
@Slf4j
public class CrmController {

    private final CrmService crmService;

    @GetMapping("/leads")
    public ResponseEntity<ApiResponse<PagedResponse<CrmLeadDto>>> getLeads(
            @PathVariable UUID businessId,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<CrmLeadDto> leads;
        if (status != null && !status.isBlank()) {
            leads = crmService.getLeadsByStatus(businessId, status, pageable);
        } else {
            List<CrmLeadDto> allLeads = crmService.getAllLeads(businessId);
            leads = PagedResponse.of(allLeads, pageable.getPageNumber(), pageable.getPageSize(), allLeads.size());
        }
        return ResponseEntity.ok(ApiResponse.success(leads));
    }

    @GetMapping("/leads/{leadId}")
    public ResponseEntity<ApiResponse<CrmLeadDto>> getLead(@PathVariable UUID businessId,
                                                          @PathVariable UUID leadId) {
        CrmLeadDto lead = crmService.getLeadById(businessId, leadId);
        return ResponseEntity.ok(ApiResponse.success(lead));
    }

    @PostMapping("/leads")
    public ResponseEntity<ApiResponse<CrmLeadDto>> createLead(@PathVariable UUID businessId,
                                                             @Valid @RequestBody CrmLeadCreateRequest request) {
        CrmLeadDto lead = crmService.createLead(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Lead created", lead));
    }

    @PutMapping("/leads/{leadId}")
    public ResponseEntity<ApiResponse<CrmLeadDto>> updateLead(@PathVariable UUID businessId,
                                                             @PathVariable UUID leadId,
                                                             @Valid @RequestBody CrmLeadCreateRequest request) {
        CrmLeadDto lead = crmService.updateLead(businessId, leadId, request);
        return ResponseEntity.ok(ApiResponse.success("Lead updated", lead));
    }

    @DeleteMapping("/leads/{leadId}")
    public ResponseEntity<ApiResponse<Void>> deleteLead(@PathVariable UUID businessId,
                                                        @PathVariable UUID leadId) {
        crmService.deleteLead(businessId, leadId);
        return ResponseEntity.ok(ApiResponse.success("Lead deleted", null));
    }

    @PostMapping("/leads/{leadId}/convert")
    public ResponseEntity<ApiResponse<com.vyaparsetu.dto.party.PartyDto>> convertLeadToParty(
            @PathVariable UUID businessId,
            @PathVariable UUID leadId,
            @Valid @RequestBody PartyCreateRequest partyRequest) {
        var party = crmService.convertLeadToParty(businessId, leadId, partyRequest);
        return ResponseEntity.ok(ApiResponse.success("Lead converted to party", party));
    }

    @PutMapping("/leads/{leadId}/assign")
    public ResponseEntity<ApiResponse<Void>> assignLead(@PathVariable UUID businessId,
                                                        @PathVariable UUID leadId,
                                                        @RequestParam UUID assignedTo) {
        crmService.assignLead(businessId, leadId, assignedTo);
        return ResponseEntity.ok(ApiResponse.success("Lead assigned", null));
    }

    @GetMapping("/leads/{leadId}/followups")
    public ResponseEntity<ApiResponse<List<FollowUpDto>>> getFollowUps(@PathVariable UUID businessId,
                                                                       @PathVariable UUID leadId) {
        List<FollowUpDto> followUps = crmService.getFollowUps(businessId, leadId);
        return ResponseEntity.ok(ApiResponse.success(followUps));
    }

    @PostMapping("/leads/{leadId}/followups")
    public ResponseEntity<ApiResponse<FollowUpDto>> createFollowUp(@PathVariable UUID businessId,
                                                                    @PathVariable UUID leadId,
                                                                    @Valid @RequestBody FollowUpDto request) {
        FollowUpDto followUp = crmService.createFollowUp(businessId, request, leadId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Follow-up created", followUp));
    }
}
