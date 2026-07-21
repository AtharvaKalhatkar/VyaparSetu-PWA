package com.vyaparsetu.service;

import com.vyaparsetu.common.*;
import com.vyaparsetu.dto.ledger.LedgerEntryDto;
import com.vyaparsetu.dto.ledger.LedgerEntryRequest;
import com.vyaparsetu.dto.ledger.LedgerSummaryDto;
import com.vyaparsetu.dto.mapper.LedgerEntryMapper;
import com.vyaparsetu.entity.ledger.LedgerBalance;
import com.vyaparsetu.entity.ledger.LedgerEntry;
import com.vyaparsetu.entity.party.Party;
import com.vyaparsetu.repository.ledger.LedgerBalanceRepository;
import com.vyaparsetu.repository.ledger.LedgerEntryRepository;
import com.vyaparsetu.repository.party.PartyRepository;
import com.vyaparsetu.service.ledger.LedgerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LedgerServiceTest {

    @Mock
    private LedgerEntryRepository ledgerEntryRepository;
    @Mock
    private LedgerBalanceRepository ledgerBalanceRepository;
    @Mock
    private PartyRepository partyRepository;
    @Mock
    private LedgerEntryMapper ledgerEntryMapper;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private LedgerService ledgerService;

    @Captor
    private ArgumentCaptor<LedgerEntry> entryCaptor;

    private UUID businessId;
    private UUID partyId;
    private UUID entryId;
    private Party party;
    private LedgerEntryRequest entryRequest;
    private LedgerEntry ledgerEntry;
    private LedgerEntryDto entryDto;
    private LedgerBalance ledgerBalance;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        partyId = UUID.randomUUID();
        entryId = UUID.randomUUID();

        party = Party.builder()
                .id(partyId)
                .businessId(businessId)
                .name("Test Party")
                .phone("9876543210")
                .build();

        entryRequest = LedgerEntryRequest.builder()
                .partyId(partyId)
                .transactionType("SALE")
                .entryType("DEBIT")
                .amount(new BigDecimal("1000"))
                .mode("CASH")
                .reference("INV-001")
                .entryDate(LocalDate.now())
                .build();

        ledgerEntry = LedgerEntry.builder()
                .id(entryId)
                .businessId(businessId)
                .partyId(partyId)
                .transactionType(LedgerEntry.TransactionType.SALE)
                .entryType(LedgerEntry.EntryType.DEBIT)
                .amount(new BigDecimal("1000"))
                .balanceAfter(new BigDecimal("1000"))
                .mode(LedgerEntry.PaymentMode.CASH)
                .reference("INV-001")
                .entryDate(LocalDate.now())
                .build();

        entryDto = LedgerEntryDto.builder()
                .id(entryId)
                .partyId(partyId)
                .transactionType("SALE")
                .entryType("DEBIT")
                .amount(new BigDecimal("1000"))
                .mode("CASH")
                .reference("INV-001")
                .entryDate(LocalDate.now())
                .build();

        ledgerBalance = LedgerBalance.builder()
                .id(UUID.randomUUID())
                .businessId(businessId)
                .partyId(partyId)
                .currentBalance(BigDecimal.ZERO)
                .asOfDate(LocalDate.now())
                .build();
    }

    @Test
    @DisplayName("createEntry should save entry and return LedgerEntryDto")
    void createEntry_shouldReturnLedgerEntryDto() {
        when(partyRepository.findByBusinessIdAndId(businessId, partyId))
                .thenReturn(Optional.of(party));
        when(ledgerEntryRepository.calculateBalanceByPartyId(businessId, partyId))
                .thenReturn(BigDecimal.ZERO);
        when(ledgerEntryRepository.save(any(LedgerEntry.class))).thenReturn(ledgerEntry);
        when(ledgerBalanceRepository.findByBusinessIdAndPartyId(businessId, partyId))
                .thenReturn(Optional.of(ledgerBalance));
        when(ledgerEntryMapper.toDto(any(LedgerEntry.class))).thenReturn(entryDto);
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        LedgerEntryDto result = ledgerService.createEntry(businessId, entryRequest);

        assertThat(result).isNotNull();
        assertThat(result.getAmount()).isEqualByComparingTo(new BigDecimal("1000"));

        verify(ledgerEntryRepository).save(any(LedgerEntry.class));
        verify(ledgerBalanceRepository).save(any(LedgerBalance.class));
    }

    @Test
    @DisplayName("createEntry should throw ResourceNotFoundException when party not found")
    void createEntry_shouldThrowException_whenPartyNotFound() {
        when(partyRepository.findByBusinessIdAndId(businessId, partyId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> ledgerService.createEntry(businessId, entryRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Party");
    }

    @Test
    @DisplayName("getEntriesByParty should return page of entries")
    void getEntriesByParty_shouldReturnPage() {
        Page<LedgerEntry> entryPage = new PageImpl<>(List.of(ledgerEntry));
        when(ledgerEntryRepository.findByBusinessIdAndPartyId(eq(businessId), eq(partyId), any()))
                .thenReturn(entryPage);
        when(ledgerEntryMapper.toDto(any(LedgerEntry.class))).thenReturn(entryDto);

        Page<LedgerEntryDto> result = ledgerService.getEntriesByParty(
                businessId, partyId, null, null, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("reverseEntry should create reversal entry and return it")
    void reverseEntry_shouldCreateReversal() {
        when(ledgerEntryRepository.findById(entryId)).thenReturn(Optional.of(ledgerEntry));
        when(ledgerEntryRepository.save(any(LedgerEntry.class))).thenReturn(ledgerEntry);
        when(ledgerEntryRepository.calculateBalanceByPartyId(businessId, partyId))
                .thenReturn(new BigDecimal("1000"));
        when(ledgerBalanceRepository.findByBusinessIdAndPartyId(businessId, partyId))
                .thenReturn(Optional.of(ledgerBalance));
        when(ledgerEntryMapper.toDto(any(LedgerEntry.class))).thenReturn(entryDto);
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        LedgerEntryDto result = ledgerService.reverseEntry(businessId, entryId, "Test reversal");

        assertThat(result).isNotNull();
        verify(ledgerEntryRepository, times(2)).save(any(LedgerEntry.class));
    }

    @Test
    @DisplayName("reverseEntry should throw ResourceNotFoundException when entry not found")
    void reverseEntry_shouldThrowException_whenEntryNotFound() {
        when(ledgerEntryRepository.findById(entryId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ledgerService.reverseEntry(businessId, entryId, "Reason"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("calculateBalance should return balance from repository")
    void calculateBalance_shouldReturnBalance() {
        when(ledgerEntryRepository.calculateBalanceByPartyId(businessId, partyId))
                .thenReturn(new BigDecimal("5000"));

        BigDecimal result = ledgerService.calculateBalance(businessId, partyId);

        assertThat(result).isEqualByComparingTo(new BigDecimal("5000"));
    }

    @Test
    @DisplayName("calculateBalance should return zero when null")
    void calculateBalance_shouldReturnZero_whenNull() {
        when(ledgerEntryRepository.calculateBalanceByPartyId(businessId, partyId))
                .thenReturn(null);

        BigDecimal result = ledgerService.calculateBalance(businessId, partyId);

        assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("getOutstandingReport should return report with aging buckets")
    void getOutstandingReport_shouldReturnReport() {
        Object[] row = new Object[]{partyId, new BigDecimal("5000")};
        when(ledgerEntryRepository.getOutstandingByBusinessId(businessId))
                .thenReturn(List.<Object[]>of(row));
        when(partyRepository.findById(partyId)).thenReturn(Optional.of(party));
        when(ledgerEntryRepository.findByBusinessIdAndPartyIdOrderByEntryDateDesc(businessId, partyId))
                .thenReturn(List.of(ledgerEntry));

        Map<String, Object> report = ledgerService.getOutstandingReport(businessId);

        assertThat(report).containsKey("totalOutstanding");
        assertThat(report).containsKey("partyWise");
        assertThat(report).containsKey("agingSummary");
        assertThat((BigDecimal) report.get("totalOutstanding"))
                .isEqualByComparingTo(new BigDecimal("5000"));
    }

    @Test
    @DisplayName("getLedgerSummary should return summary")
    void getLedgerSummary_shouldReturnSummary() {
        when(ledgerEntryRepository.findByBusinessIdAndEntryDateBetween(eq(businessId), any(), any()))
                .thenReturn(List.of(ledgerEntry));
        when(ledgerBalanceRepository.findByBusinessId(businessId)).thenReturn(List.of(ledgerBalance));

        LedgerSummaryDto result = ledgerService.getLedgerSummary(
                businessId, LocalDate.now().minusDays(30), LocalDate.now());

        assertThat(result).isNotNull();
        assertThat(result.getTotalDebits()).isEqualByComparingTo(new BigDecimal("1000"));
        assertThat(result.getTotalCredits()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("updateBalance should update party balance")
    void updateBalance_shouldUpdateBalance() {
        when(partyRepository.findById(partyId)).thenReturn(Optional.of(party));
        when(ledgerBalanceRepository.findByBusinessId(businessId)).thenReturn(List.of(ledgerBalance));
        when(ledgerBalanceRepository.save(any(LedgerBalance.class))).thenReturn(ledgerBalance);

        ledgerService.updateBalance(partyId, new BigDecimal("500"), "DEBIT");

        verify(ledgerBalanceRepository).save(any(LedgerBalance.class));
    }
}
