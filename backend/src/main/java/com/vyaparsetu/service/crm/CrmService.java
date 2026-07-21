package com.vyaparsetu.service.crm;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.BadRequestException;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.crm.CrmLeadCreateRequest;
import com.vyaparsetu.dto.crm.CrmLeadDto;
import com.vyaparsetu.dto.crm.FollowUpDto;
import com.vyaparsetu.dto.mapper.CrmLeadMapper;
import com.vyaparsetu.dto.party.PartyCreateRequest;
import com.vyaparsetu.dto.party.PartyDto;
import com.vyaparsetu.entity.crm.CrmLead;
import com.vyaparsetu.entity.crm.CrmLead.LeadStatus;
import com.vyaparsetu.entity.crm.FollowUp;
import com.vyaparsetu.entity.crm.FollowUp.FollowUpStatus;
import com.vyaparsetu.entity.crm.FollowUp.FollowUpType;
import com.vyaparsetu.repository.crm.CrmLeadRepository;
import com.vyaparsetu.repository.crm.FollowUpRepository;
import com.vyaparsetu.service.party.PartyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CrmService {

    private final CrmLeadRepository crmLeadRepository;
    private final FollowUpRepository followUpRepository;
    private final CrmLeadMapper crmLeadMapper;
    private final PartyService partyService;
    private final AuditService auditService;

    @Transactional
    public CrmLeadDto createLead(UUID businessId, CrmLeadCreateRequest request) {
        log.info("Creating lead in business: {}", businessId);

        CrmLead lead = crmLeadMapper.toEntity(request);
        lead.setBusinessId(businessId);
        if (lead.getStatus() == null) lead.setStatus(LeadStatus.NEW);
        lead = crmLeadRepository.save(lead);

        auditService.logEvent(businessId.toString(), "CREATE_LEAD", "CrmLead", lead.getId(),
                null, Map.of("company", lead.getCompanyName(), "status", lead.getStatus().name()));

        return crmLeadMapper.toDto(lead);
    }

    @Transactional
    public CrmLeadDto updateLead(UUID businessId, UUID leadId, CrmLeadCreateRequest request) {
        log.info("Updating lead: {} in business: {}", leadId, businessId);

        CrmLead lead = crmLeadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("CrmLead", leadId));

        if (request.getCompanyName() != null) lead.setCompanyName(request.getCompanyName());
        if (request.getContactPerson() != null) lead.setContactPerson(request.getContactPerson());
        if (request.getPhone() != null) lead.setPhone(request.getPhone());
        if (request.getEmail() != null) lead.setEmail(request.getEmail());
        if (request.getLeadSource() != null) lead.setLeadSource(CrmLead.LeadSource.valueOf(request.getLeadSource().toUpperCase()));
        if (request.getStatus() != null) lead.setStatus(LeadStatus.valueOf(request.getStatus().toUpperCase()));
        if (request.getPriority() != null) lead.setPriority(CrmLead.LeadPriority.valueOf(request.getPriority().toUpperCase()));
        if (request.getAssignedToId() != null) lead.setAssignedToId(request.getAssignedToId());
        if (request.getExpectedValue() != null) lead.setExpectedValue(request.getExpectedValue());
        if (request.getProbability() != null) lead.setProbability(request.getProbability());
        if (request.getNotes() != null) lead.setNotes(request.getNotes());

        lead = crmLeadRepository.save(lead);

        auditService.logEvent(businessId.toString(), "UPDATE_LEAD", "CrmLead", leadId,
                null, Map.of("company", lead.getCompanyName()));

        return crmLeadMapper.toDto(lead);
    }

    @Transactional
    public void deleteLead(UUID businessId, UUID leadId) {
        log.info("Deleting lead: {} in business: {}", leadId, businessId);

        CrmLead lead = crmLeadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("CrmLead", leadId));
        lead.setDeleted(true);
        crmLeadRepository.save(lead);

        auditService.logEvent(businessId.toString(), "DELETE_LEAD", "CrmLead", leadId, null, null);
    }

    @Transactional(readOnly = true)
    public CrmLeadDto getLeadById(UUID businessId, UUID leadId) {
        CrmLead lead = crmLeadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("CrmLead", leadId));
        return crmLeadMapper.toDto(lead);
    }

    @Transactional(readOnly = true)
    public List<CrmLeadDto> getAllLeads(UUID businessId) {
        List<CrmLead> leads = crmLeadRepository.findByBusinessIdAndIsActiveTrue(businessId);
        return crmLeadMapper.toDtoList(leads);
    }

    @Transactional
    public FollowUpDto createFollowUp(UUID businessId, FollowUpDto request, UUID leadId) {
        log.info("Creating follow-up for lead: {} in business: {}", leadId, businessId);

        CrmLead lead = crmLeadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("CrmLead", leadId));

        FollowUp followUp = FollowUp.builder()
                .businessId(businessId)
                .leadId(leadId)
                .partyId(lead.getPartyId())
                .followUpDate(request.getFollowUpDate() != null ? request.getFollowUpDate() : LocalDate.now())
                .followUpTime(request.getFollowUpTime() != null ? request.getFollowUpTime() : LocalTime.NOON)
                .type(request.getType() != null ? FollowUpType.valueOf(request.getType().toUpperCase()) : FollowUpType.CALL)
                .status(FollowUpStatus.PENDING)
                .notes(request.getNotes())
                .build();
        followUp = followUpRepository.save(followUp);

        return toFollowUpDto(followUp);
    }

    @Transactional(readOnly = true)
    public List<FollowUpDto> getFollowUps(UUID businessId, UUID leadId) {
        List<FollowUp> followUps = followUpRepository.findByBusinessIdAndLeadId(businessId, leadId);
        return followUps.stream().map(this::toFollowUpDto).toList();
    }

    @Transactional
    public PartyDto convertLeadToParty(UUID businessId, UUID leadId, PartyCreateRequest partyRequest) {
        log.info("Converting lead: {} to party in business: {}", leadId, businessId);

        CrmLead lead = crmLeadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("CrmLead", leadId));

        if (lead.getStatus() == LeadStatus.WON || lead.getConvertedToPartyId() != null) {
            throw new BadRequestException("Lead already converted");
        }

        PartyDto partyDto = partyService.createParty(businessId, partyRequest);

        lead.setStatus(LeadStatus.WON);
        lead.setConvertedAt(Instant.now());
        lead.setConvertedToPartyId(partyDto.getId());
        crmLeadRepository.save(lead);

        auditService.logEvent(businessId.toString(), "CONVERT_LEAD_TO_PARTY", "CrmLead", leadId,
                null, Map.of("partyId", partyDto.getId().toString()));

        return partyDto;
    }

    @Transactional(readOnly = true)
    public PagedResponse<CrmLeadDto> getLeadsByStatus(UUID businessId, String status, Pageable pageable) {
        Page<CrmLead> leadPage = crmLeadRepository.findByBusinessIdAndStatus(businessId,
                LeadStatus.valueOf(status.toUpperCase()), pageable);
        List<CrmLeadDto> dtos = crmLeadMapper.toDtoList(leadPage.getContent());
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                leadPage.getTotalElements());
    }

    @Transactional
    public void assignLead(UUID businessId, UUID leadId, UUID assignedToId) {
        log.info("Assigning lead: {} to user: {} in business: {}", leadId, assignedToId, businessId);

        CrmLead lead = crmLeadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("CrmLead", leadId));
        lead.setAssignedToId(assignedToId);
        crmLeadRepository.save(lead);

        auditService.logEvent(businessId.toString(), "ASSIGN_LEAD", "CrmLead", leadId,
                null, Map.of("assignedToId", assignedToId.toString()));
    }

    private FollowUpDto toFollowUpDto(FollowUp followUp) {
        return FollowUpDto.builder()
                .id(followUp.getId())
                .leadId(followUp.getLeadId())
                .partyId(followUp.getPartyId())
                .followUpDate(followUp.getFollowUpDate())
                .followUpTime(followUp.getFollowUpTime())
                .type(followUp.getType() != null ? followUp.getType().name() : null)
                .status(followUp.getStatus() != null ? followUp.getStatus().name() : null)
                .notes(followUp.getNotes())
                .completedAt(followUp.getCompletedAt())
                .build();
    }
}
