package com.vyaparsetu.service;

import com.vyaparsetu.common.*;
import com.vyaparsetu.dto.ledger.LedgerEntryDto;
import com.vyaparsetu.dto.mapper.LedgerEntryMapper;
import com.vyaparsetu.dto.mapper.PartyMapper;
import com.vyaparsetu.dto.party.*;
import com.vyaparsetu.entity.ledger.LedgerBalance;
import com.vyaparsetu.entity.ledger.LedgerEntry;
import com.vyaparsetu.entity.party.Party;
import com.vyaparsetu.repository.ledger.LedgerBalanceRepository;
import com.vyaparsetu.repository.ledger.LedgerEntryRepository;
import com.vyaparsetu.repository.party.PartyRepository;
import com.vyaparsetu.service.party.PartyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PartyServiceTest {

    @Mock
    private PartyRepository partyRepository;
    @Mock
    private LedgerBalanceRepository ledgerBalanceRepository;
    @Mock
    private LedgerEntryRepository ledgerEntryRepository;
    @Mock
    private PartyMapper partyMapper;
    @Mock
    private LedgerEntryMapper ledgerEntryMapper;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private PartyService partyService;

    private UUID businessId;
    private UUID partyId;
    private Party party;
    private PartyDto partyDto;
    private PartyCreateRequest createRequest;
    private PartyUpdateRequest updateRequest;
    private LedgerBalance ledgerBalance;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        partyId = UUID.randomUUID();

        party = Party.builder()
                .id(partyId)
                .businessId(businessId)
                .name("Test Party")
                .phone("9876543210")
                .email("party@test.com")
                .type(Party.PartyType.CUSTOMER)
                .country("India")
                .isActive(true)
                .build();

        partyDto = PartyDto.builder()
                .id(partyId)
                .name("Test Party")
                .phone("9876543210")
                .type("CUSTOMER")
                .country("India")
                .currentBalance(BigDecimal.ZERO)
                .build();

        createRequest = PartyCreateRequest.builder()
                .name("Test Party")
                .phone("9876543210")
                .type("CUSTOMER")
                .build();

        updateRequest = PartyUpdateRequest.builder()
                .name("Updated Party")
                .phone("9876543211")
                .build();

        ledgerBalance = LedgerBalance.builder()
                .id(UUID.randomUUID())
                .businessId(businessId)
                .partyId(partyId)
                .currentBalance(new BigDecimal("5000"))
                .balanceType(LedgerBalance.BalanceType.DEBIT)
                .asOfDate(LocalDate.now())
                .build();
    }

    @Test
    @DisplayName("createParty should save party and return PartyDto")
    void createParty_shouldReturnPartyDto() {
        when(partyMapper.toEntity(any(PartyCreateRequest.class))).thenReturn(party);
        when(partyRepository.save(any(Party.class))).thenReturn(party);
        when(partyMapper.toDto(any(Party.class))).thenReturn(partyDto);
        when(ledgerEntryRepository.calculateBalanceByPartyId(any(), any())).thenReturn(BigDecimal.ZERO);
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        PartyDto result = partyService.createParty(businessId, createRequest);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Test Party");

        verify(partyRepository).save(any(Party.class));
        verify(auditService).logEvent(anyString(), eq("CREATE_PARTY"), anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("createParty with opening balance should create LedgerBalance")
    void createParty_withOpeningBalance_shouldCreateLedgerBalance() {
        createRequest.setOpeningBalance(new BigDecimal("1000"));
        createRequest.setBalanceType("DEBIT");

        when(partyMapper.toEntity(any(PartyCreateRequest.class))).thenReturn(party);
        when(partyRepository.save(any(Party.class))).thenReturn(party);
        when(ledgerBalanceRepository.save(any(LedgerBalance.class))).thenReturn(ledgerBalance);
        when(partyMapper.toDto(any(Party.class))).thenReturn(partyDto);
        when(ledgerEntryRepository.calculateBalanceByPartyId(any(), any())).thenReturn(BigDecimal.ZERO);
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        partyService.createParty(businessId, createRequest);

        verify(ledgerBalanceRepository).save(any(LedgerBalance.class));
    }

    @Test
    @DisplayName("createParty should throw DuplicateResourceException for duplicate phone")
    void createParty_shouldThrowException_whenDuplicatePhone() {
        createRequest.setPhone("9876543210");
        when(partyRepository.findByBusinessIdAndPhone(businessId, "9876543210"))
                .thenReturn(Optional.of(party));

        assertThatThrownBy(() -> partyService.createParty(businessId, createRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("phone");

        verify(partyRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateParty should update and return updated PartyDto")
    void updateParty_shouldReturnUpdatedPartyDto() {
        when(partyRepository.findByBusinessIdAndId(businessId, partyId))
                .thenReturn(Optional.of(party));
        when(partyRepository.save(any(Party.class))).thenReturn(party);
        when(partyMapper.toDto(any(Party.class))).thenReturn(partyDto);
        when(ledgerEntryRepository.calculateBalanceByPartyId(any(), any())).thenReturn(BigDecimal.ZERO);
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        PartyDto result = partyService.updateParty(businessId, partyId, updateRequest);

        assertThat(result).isNotNull();
        verify(partyRepository).save(any(Party.class));
        verify(auditService).logEvent(anyString(), eq("UPDATE_PARTY"), anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("updateParty should throw ResourceNotFoundException when party not found")
    void updateParty_shouldThrowException_whenNotFound() {
        when(partyRepository.findByBusinessIdAndId(businessId, partyId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> partyService.updateParty(businessId, partyId, updateRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Party");
    }

    @Test
    @DisplayName("deleteParty should soft delete party")
    void deleteParty_shouldSoftDelete() {
        when(partyRepository.findByBusinessIdAndId(businessId, partyId))
                .thenReturn(Optional.of(party));
        when(partyRepository.save(any(Party.class))).thenReturn(party);
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        partyService.deleteParty(businessId, partyId);

        assertThat(party.isDeleted()).isTrue();
        verify(partyRepository).save(party);
        verify(auditService).logEvent(anyString(), eq("DELETE_PARTY"), anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("getPartyById should return PartyDto with balance")
    void getPartyById_shouldReturnPartyDto() {
        when(partyRepository.findByBusinessIdAndId(businessId, partyId))
                .thenReturn(Optional.of(party));
        when(partyMapper.toDto(any(Party.class))).thenReturn(partyDto);
        when(ledgerEntryRepository.calculateBalanceByPartyId(businessId, partyId))
                .thenReturn(new BigDecimal("5000"));

        PartyDto result = partyService.getPartyById(businessId, partyId);

        assertThat(result).isNotNull();
        verify(partyMapper).toDto(party);
    }

    @Test
    @DisplayName("getPartyById should throw ResourceNotFoundException when not found")
    void getPartyById_shouldThrowException_whenNotFound() {
        when(partyRepository.findByBusinessIdAndId(businessId, partyId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> partyService.getPartyById(businessId, partyId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getPartiesByBusiness should return paged parties")
    void getPartiesByBusiness_shouldReturnPagedResponse() {
        Page<Party> partyPage = new PageImpl<>(List.of(party));
        when(partyRepository.findByBusinessId(eq(businessId), any(Pageable.class)))
                .thenReturn(partyPage);
        when(partyMapper.toDtoList(anyList())).thenReturn(List.of(partyDto));
        when(ledgerEntryRepository.calculateBalanceByPartyId(any(), any())).thenReturn(BigDecimal.ZERO);

        var result = partyService.getPartiesByBusiness(businessId, null, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("getOutstandingParties should return list of PartyBalanceDto")
    void getOutstandingParties_shouldReturnList() {
        when(ledgerBalanceRepository.findByBusinessId(businessId))
                .thenReturn(List.of(ledgerBalance));
        when(partyRepository.findById(partyId)).thenReturn(Optional.of(party));

        List<PartyBalanceDto> result = partyService.getOutstandingParties(businessId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPartyName()).isEqualTo("Test Party");
        assertThat(result.get(0).getCurrentBalance()).isEqualByComparingTo(new BigDecimal("5000"));
    }

    @Test
    @DisplayName("getOutstandingParties should filter out zero balance")
    void getOutstandingParties_shouldFilterZeroBalance() {
        ledgerBalance.setCurrentBalance(BigDecimal.ZERO);
        when(ledgerBalanceRepository.findByBusinessId(businessId))
                .thenReturn(List.of(ledgerBalance));

        List<PartyBalanceDto> result = partyService.getOutstandingParties(businessId);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("searchParties should return search results")
    void searchParties_shouldReturnResults() {
        Page<Party> partyPage = new PageImpl<>(List.of(party));
        when(partyRepository.searchByNameOrPhone(eq(businessId), eq("test"), any(Pageable.class)))
                .thenReturn(partyPage);
        when(partyMapper.toDtoList(anyList())).thenReturn(List.of(partyDto));
        when(ledgerEntryRepository.calculateBalanceByPartyId(any(), any())).thenReturn(BigDecimal.ZERO);

        var result = partyService.searchParties(businessId, "test", PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("getPartyLedger should return party ledger with entries")
    void getPartyLedger_shouldReturnLedger() {
        LedgerEntry entry = LedgerEntry.builder()
                .id(UUID.randomUUID())
                .businessId(businessId)
                .partyId(partyId)
                .amount(new BigDecimal("1000"))
                .entryDate(LocalDate.now())
                .build();

        Page<LedgerEntry> entryPage = new PageImpl<>(List.of(entry));
        when(partyRepository.findByBusinessIdAndId(businessId, partyId))
                .thenReturn(Optional.of(party));
        when(ledgerEntryRepository.findByBusinessIdAndPartyId(eq(businessId), eq(partyId), any(Pageable.class)))
                .thenReturn(entryPage);
        when(partyMapper.toDto(any(Party.class))).thenReturn(partyDto);
        when(ledgerEntryMapper.toDtoList(anyList())).thenReturn(List.of(mock(LedgerEntryDto.class)));
        when(ledgerEntryRepository.calculateBalanceByPartyId(businessId, partyId))
                .thenReturn(new BigDecimal("1000"));

        PartyLedgerDto result = partyService.getPartyLedger(businessId, partyId, null, null, PageRequest.of(0, 20));

        assertThat(result).isNotNull();
        assertThat(result.getParty()).isNotNull();
    }
}
