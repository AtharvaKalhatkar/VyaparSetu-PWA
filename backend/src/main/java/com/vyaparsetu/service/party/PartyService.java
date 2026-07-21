package com.vyaparsetu.service.party;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.BadRequestException;
import com.vyaparsetu.common.DuplicateResourceException;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.ledger.LedgerEntryDto;
import com.vyaparsetu.dto.mapper.LedgerEntryMapper;
import com.vyaparsetu.dto.mapper.PartyMapper;
import com.vyaparsetu.dto.party.PartyBalanceDto;
import com.vyaparsetu.dto.party.PartyCreateRequest;
import com.vyaparsetu.dto.party.PartyDto;
import com.vyaparsetu.dto.party.PartyLedgerDto;
import com.vyaparsetu.dto.party.PartyUpdateRequest;
import com.vyaparsetu.entity.ledger.LedgerBalance;
import com.vyaparsetu.entity.ledger.LedgerEntry;
import com.vyaparsetu.entity.party.Party;
import com.vyaparsetu.entity.party.Party.PartyType;
import com.vyaparsetu.repository.ledger.LedgerBalanceRepository;
import com.vyaparsetu.repository.ledger.LedgerEntryRepository;
import com.vyaparsetu.repository.party.PartyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartyService {

    private final PartyRepository partyRepository;
    private final LedgerBalanceRepository ledgerBalanceRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final PartyMapper partyMapper;
    private final LedgerEntryMapper ledgerEntryMapper;
    private final AuditService auditService;

    @Transactional
    public PartyDto createParty(UUID businessId, PartyCreateRequest request) {
        log.info("Creating party in business: {}", businessId);

        if (request.getPhone() != null) {
            partyRepository.findByBusinessIdAndPhone(businessId, request.getPhone())
                    .ifPresent(p -> { throw new DuplicateResourceException("Party", "phone", request.getPhone()); });
        }

        Party party = partyMapper.toEntity(request);
        party.setBusinessId(businessId);
        party = partyRepository.save(party);

        if (request.getOpeningBalance() != null && request.getOpeningBalance().compareTo(BigDecimal.ZERO) != 0) {
            LedgerBalance ledgerBalance = LedgerBalance.builder()
                    .businessId(businessId)
                    .partyId(party.getId())
                    .currentBalance(request.getOpeningBalance())
                    .balanceType(request.getBalanceType() != null ?
                            LedgerBalance.BalanceType.valueOf(request.getBalanceType()) :
                            LedgerBalance.BalanceType.DEBIT)
                    .asOfDate(LocalDate.now())
                    .build();
            ledgerBalanceRepository.save(ledgerBalance);
        }

        auditService.logEvent(businessId.toString(), "CREATE_PARTY", "Party", party.getId(),
                null, Map.of("name", party.getName(), "type", party.getType().name()));

        PartyDto dto = partyMapper.toDto(party);
        enrichWithBalance(dto, businessId, party.getId());
        return dto;
    }

    @Transactional
    public PartyDto updateParty(UUID businessId, UUID partyId, PartyUpdateRequest request) {
        log.info("Updating party: {} in business: {}", partyId, businessId);

        Party party = partyRepository.findByBusinessIdAndId(businessId, partyId)
                .orElseThrow(() -> new ResourceNotFoundException("Party", partyId));

        if (request.getName() != null) party.setName(request.getName());
        if (request.getPhone() != null) party.setPhone(request.getPhone());
        if (request.getEmail() != null) party.setEmail(request.getEmail());
        if (request.getGstin() != null) party.setGstin(request.getGstin());
        if (request.getPan() != null) party.setPan(request.getPan());
        if (request.getAddressLine1() != null) party.setAddressLine1(request.getAddressLine1());
        if (request.getAddressLine2() != null) party.setAddressLine2(request.getAddressLine2());
        if (request.getCity() != null) party.setCity(request.getCity());
        if (request.getState() != null) party.setState(request.getState());
        if (request.getPincode() != null) party.setPincode(request.getPincode());
        if (request.getType() != null) party.setType(PartyType.valueOf(request.getType()));
        if (request.getPartyType() != null) party.setPartyType(request.getPartyType());
        if (request.getOpeningBalance() != null) party.setOpeningBalance(request.getOpeningBalance());
        if (request.getBalanceType() != null)
            party.setBalanceType(Party.BalanceType.valueOf(request.getBalanceType()));
        if (request.getCreditLimit() != null) party.setCreditLimit(request.getCreditLimit());
        if (request.getCreditDays() != null) party.setCreditDays(request.getCreditDays());
        if (request.getPriceCategory() != null)
            party.setPriceCategory(Party.PriceCategory.valueOf(request.getPriceCategory()));
        if (request.getNotes() != null) party.setNotes(request.getNotes());
        if (request.getTags() != null) party.setTags(request.getTags());
        if (request.getPhotoUrl() != null) party.setPhotoUrl(request.getPhotoUrl());
        if (request.getCustomFields() != null && request.getCustomFields() instanceof String s)
            party.setCustomFields(s);

        party = partyRepository.save(party);

        auditService.logEvent(businessId.toString(), "UPDATE_PARTY", "Party", partyId,
                null, Map.of("name", party.getName()));

        PartyDto dto = partyMapper.toDto(party);
        enrichWithBalance(dto, businessId, party.getId());
        return dto;
    }

    @Transactional
    public void deleteParty(UUID businessId, UUID partyId) {
        log.info("Deleting party: {} in business: {}", partyId, businessId);

        Party party = partyRepository.findByBusinessIdAndId(businessId, partyId)
                .orElseThrow(() -> new ResourceNotFoundException("Party", partyId));
        party.setDeleted(true);
        partyRepository.save(party);

        auditService.logEvent(businessId.toString(), "DELETE_PARTY", "Party", partyId,
                null, null);
    }

    @Transactional(readOnly = true)
    public PartyDto getPartyById(UUID businessId, UUID partyId) {
        Party party = partyRepository.findByBusinessIdAndId(businessId, partyId)
                .orElseThrow(() -> new ResourceNotFoundException("Party", partyId));
        PartyDto dto = partyMapper.toDto(party);
        enrichWithBalance(dto, businessId, party.getId());
        return dto;
    }

    @Transactional(readOnly = true)
    public PagedResponse<PartyDto> getPartiesByBusiness(UUID businessId, String type, Pageable pageable) {
        Page<Party> partyPage;
        if (type != null && !type.isBlank()) {
            partyPage = partyRepository.findByBusinessIdAndType(businessId, PartyType.valueOf(type.toUpperCase()), pageable);
        } else {
            partyPage = partyRepository.findByBusinessId(businessId, pageable);
        }
        List<PartyDto> dtos = partyMapper.toDtoList(partyPage.getContent());
        dtos.forEach(dto -> enrichWithBalance(dto, businessId, dto.getId()));
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                partyPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PagedResponse<PartyDto> searchParties(UUID businessId, String query, Pageable pageable) {
        Page<Party> partyPage = partyRepository.searchByNameOrPhone(businessId, query, pageable);
        List<PartyDto> dtos = partyMapper.toDtoList(partyPage.getContent());
        dtos.forEach(dto -> enrichWithBalance(dto, businessId, dto.getId()));
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                partyPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<PartyBalanceDto> getOutstandingParties(UUID businessId) {
        List<LedgerBalance> balances = ledgerBalanceRepository.findByBusinessId(businessId);
        return balances.stream()
                .filter(b -> b.getCurrentBalance().compareTo(BigDecimal.ZERO) > 0)
                .map(b -> {
                    Party party = partyRepository.findById(b.getPartyId()).orElse(null);
                    return PartyBalanceDto.builder()
                            .partyId(b.getPartyId())
                            .partyName(party != null ? party.getName() : "Unknown")
                            .phone(party != null ? party.getPhone() : null)
                            .currentBalance(b.getCurrentBalance())
                            .balanceType(b.getBalanceType() != null ? b.getBalanceType().name() : null)
                            .totalDue(b.getTotalDue())
                            .totalOverdue(b.getTotalOverdue())
                            .creditLimit(b.getCreditLimit())
                            .asOfDate(b.getAsOfDate())
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public PartyLedgerDto getPartyLedger(UUID businessId, UUID partyId,
                                          LocalDate startDate, LocalDate endDate, Pageable pageable) {
        Party party = partyRepository.findByBusinessIdAndId(businessId, partyId)
                .orElseThrow(() -> new ResourceNotFoundException("Party", partyId));

        Page<LedgerEntry> entryPage;
        if (startDate != null && endDate != null) {
            List<LedgerEntry> allEntries = ledgerEntryRepository
                    .findByBusinessIdAndPartyIdOrderByEntryDateDesc(businessId, partyId);
            List<LedgerEntry> filtered = allEntries.stream()
                    .filter(e -> !e.getEntryDate().isBefore(startDate) && !e.getEntryDate().isAfter(endDate))
                    .toList();
            entryPage = new org.springframework.data.domain.PageImpl<>(filtered, pageable, filtered.size());
        } else {
            entryPage = ledgerEntryRepository.findByBusinessIdAndPartyId(businessId, partyId, pageable);
        }

        BigDecimal openingBalance = calculateOpeningBalance(businessId, partyId, startDate);
        BigDecimal closingBalance = calculateBalance(businessId, partyId);

        return PartyLedgerDto.builder()
                .party(partyMapper.toDto(party))
                .entries(ledgerEntryMapper.toDtoList(entryPage.getContent()))
                .openingBalance(openingBalance)
                .closingBalance(closingBalance)
                .build();
    }

    @Transactional(readOnly = true)
    public PartyBalanceDto getPartyBalance(UUID businessId, UUID partyId) {
        partyRepository.findByBusinessIdAndId(businessId, partyId)
                .orElseThrow(() -> new ResourceNotFoundException("Party", partyId));

        Optional<LedgerBalance> balance = ledgerBalanceRepository.findByBusinessIdAndPartyId(businessId, partyId);
        Party party = partyRepository.findById(partyId).orElse(null);

        if (balance.isPresent()) {
            LedgerBalance lb = balance.get();
            return PartyBalanceDto.builder()
                    .partyId(partyId)
                    .partyName(party != null ? party.getName() : "Unknown")
                    .phone(party != null ? party.getPhone() : null)
                    .currentBalance(lb.getCurrentBalance())
                    .balanceType(lb.getBalanceType() != null ? lb.getBalanceType().name() : null)
                    .totalDue(lb.getTotalDue())
                    .totalOverdue(lb.getTotalOverdue())
                    .creditLimit(lb.getCreditLimit())
                    .asOfDate(lb.getAsOfDate())
                    .build();
        }

        return PartyBalanceDto.builder()
                .partyId(partyId)
                .partyName(party != null ? party.getName() : "Unknown")
                .currentBalance(BigDecimal.ZERO)
                .asOfDate(LocalDate.now())
                .build();
    }

    @Transactional
    public List<PartyDto> importParties(UUID businessId, MultipartFile csvFile) {
        log.info("Importing parties from CSV for business: {}", businessId);
        List<PartyDto> imported = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(csvFile.getInputStream()))) {
            String header = reader.readLine();
            if (header == null) throw new BadRequestException("CSV file is empty");

            String line;
            while ((line = reader.readLine()) != null) {
                String[] fields = line.split(",");
                if (fields.length < 2) continue;

                PartyCreateRequest request = PartyCreateRequest.builder()
                        .name(fields[0].trim())
                        .phone(fields.length > 1 ? fields[1].trim() : null)
                        .email(fields.length > 2 ? fields[2].trim() : null)
                        .gstin(fields.length > 3 ? fields[3].trim() : null)
                        .city(fields.length > 4 ? fields[4].trim() : null)
                        .state(fields.length > 5 ? fields[5].trim() : null)
                        .type(fields.length > 6 ? fields[6].trim() : "CUSTOMER")
                        .build();

                try {
                    PartyDto dto = createParty(businessId, request);
                    imported.add(dto);
                } catch (Exception e) {
                    log.warn("Failed to import party {}: {}", request.getName(), e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new BadRequestException("Failed to import CSV: " + e.getMessage());
        }

        return imported;
    }

    private void enrichWithBalance(PartyDto dto, UUID businessId, UUID partyId) {
        try {
            BigDecimal balance = ledgerEntryRepository.calculateBalanceByPartyId(businessId, partyId);
            dto.setCurrentBalance(balance != null ? balance : BigDecimal.ZERO);

            Optional<LedgerBalance> lb = ledgerBalanceRepository.findByBusinessIdAndPartyId(businessId, partyId);
            lb.ifPresent(l -> {
                dto.setTotalDue(l.getTotalDue());
                dto.setTotalOverdue(l.getTotalOverdue());
            });
        } catch (Exception e) {
            dto.setCurrentBalance(BigDecimal.ZERO);
        }
    }

    private BigDecimal calculateOpeningBalance(UUID businessId, UUID partyId, LocalDate startDate) {
        if (startDate == null) return BigDecimal.ZERO;
        List<LedgerEntry> entriesBefore = ledgerEntryRepository
                .findByBusinessIdAndPartyIdOrderByEntryDateDesc(businessId, partyId)
                .stream()
                .filter(e -> e.getEntryDate().isBefore(startDate))
                .toList();
        return entriesBefore.stream()
                .map(e -> e.getEntryType() == LedgerEntry.EntryType.DEBIT ? e.getAmount() : e.getAmount().negate())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateBalance(UUID businessId, UUID partyId) {
        BigDecimal balance = ledgerEntryRepository.calculateBalanceByPartyId(businessId, partyId);
        return balance != null ? balance : BigDecimal.ZERO;
    }
}
