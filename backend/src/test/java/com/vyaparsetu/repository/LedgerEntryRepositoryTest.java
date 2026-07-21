package com.vyaparsetu.repository;

import com.vyaparsetu.entity.ledger.LedgerEntry;
import com.vyaparsetu.repository.ledger.LedgerEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class LedgerEntryRepositoryTest {

    @Autowired
    private LedgerEntryRepository ledgerEntryRepository;

    private UUID businessId;
    private UUID partyId;
    private LedgerEntry debitEntry;
    private LedgerEntry creditEntry;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        partyId = UUID.randomUUID();
        UUID otherPartyId = UUID.randomUUID();

        debitEntry = LedgerEntry.builder()
                .businessId(businessId)
                .partyId(partyId)
                .transactionType(LedgerEntry.TransactionType.SALE)
                .entryType(LedgerEntry.EntryType.DEBIT)
                .amount(new BigDecimal("1000"))
                .mode(LedgerEntry.PaymentMode.CASH)
                .reference("INV-001")
                .entryDate(LocalDate.now())
                .build();
        ledgerEntryRepository.save(debitEntry);

        creditEntry = LedgerEntry.builder()
                .businessId(businessId)
                .partyId(partyId)
                .transactionType(LedgerEntry.TransactionType.PAYMENT)
                .entryType(LedgerEntry.EntryType.CREDIT)
                .amount(new BigDecimal("500"))
                .mode(LedgerEntry.PaymentMode.BANK)
                .reference("PAY-001")
                .entryDate(LocalDate.now().minusDays(1))
                .build();
        ledgerEntryRepository.save(creditEntry);

        LedgerEntry otherEntry = LedgerEntry.builder()
                .businessId(UUID.randomUUID())
                .partyId(otherPartyId)
                .transactionType(LedgerEntry.TransactionType.SALE)
                .entryType(LedgerEntry.EntryType.DEBIT)
                .amount(new BigDecimal("2000"))
                .mode(LedgerEntry.PaymentMode.CASH)
                .entryDate(LocalDate.now())
                .build();
        ledgerEntryRepository.save(otherEntry);
    }

    @Test
    @DisplayName("findByBusinessIdAndPartyId should return entries for business and party")
    void findByBusinessIdAndPartyId_shouldReturnEntries() {
        Page<LedgerEntry> result = ledgerEntryRepository.findByBusinessIdAndPartyId(
                businessId, partyId, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(2);
    }

    @Test
    @DisplayName("findByBusinessIdAndPartyId should return empty for wrong party")
    void findByBusinessIdAndPartyId_shouldReturnEmpty_forWrongParty() {
        Page<LedgerEntry> result = ledgerEntryRepository.findByBusinessIdAndPartyId(
                businessId, UUID.randomUUID(), PageRequest.of(0, 20));

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    @DisplayName("findByBusinessIdAndEntryDateBetween should filter by date range")
    void findByBusinessIdAndEntryDateBetween_shouldFilterByDate() {
        List<LedgerEntry> result = ledgerEntryRepository.findByBusinessIdAndEntryDateBetween(
                businessId, LocalDate.now().minusDays(2), LocalDate.now());

        assertThat(result).hasSize(2);

        List<LedgerEntry> futureResult = ledgerEntryRepository.findByBusinessIdAndEntryDateBetween(
                businessId, LocalDate.now().plusDays(1), LocalDate.now().plusDays(10));

        assertThat(futureResult).isEmpty();
    }

    @Test
    @DisplayName("findByBusinessIdAndPartyIdOrderByEntryDateDesc should return sorted entries")
    void findByBusinessIdAndPartyIdOrderByEntryDateDesc_shouldReturnSorted() {
        List<LedgerEntry> result = ledgerEntryRepository.findByBusinessIdAndPartyIdOrderByEntryDateDesc(
                businessId, partyId);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getEntryDate()).isAfterOrEqualTo(result.get(1).getEntryDate());
    }

    @Test
    @DisplayName("calculateBalanceByPartyId should return correct balance")
    void calculateBalanceByPartyId_shouldReturnCorrectBalance() {
        BigDecimal balance = ledgerEntryRepository.calculateBalanceByPartyId(businessId, partyId);

        assertThat(balance).isEqualByComparingTo(new BigDecimal("500")); // 1000 DEBIT - 500 CREDIT
    }

    @Test
    @DisplayName("calculateBalanceByPartyId should return zero for no entries")
    void calculateBalanceByPartyId_shouldReturnZero_whenNoEntries() {
        BigDecimal balance = ledgerEntryRepository.calculateBalanceByPartyId(
                UUID.randomUUID(), UUID.randomUUID());

        assertThat(balance).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("getOutstandingByBusinessId should return aggregated balances")
    void getOutstandingByBusinessId_shouldReturnAggregated() {
        List<Object[]> result = ledgerEntryRepository.getOutstandingByBusinessId(businessId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0)[0]).isEqualTo(partyId);
        assertThat((BigDecimal) result.get(0)[1]).isEqualByComparingTo(new BigDecimal("500"));
    }

    @Test
    @DisplayName("findByBusinessId should return paginated results")
    void findByBusinessId_shouldReturnPaginated() {
        Page<LedgerEntry> result = ledgerEntryRepository.findByBusinessId(businessId, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("findByBusinessIdAndTransactionType should filter by type")
    void findByBusinessIdAndTransactionType_shouldFilterByType() {
        Page<LedgerEntry> result = ledgerEntryRepository.findByBusinessIdAndTransactionType(
                businessId, LedgerEntry.TransactionType.SALE, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);

        Page<LedgerEntry> purchaseResult = ledgerEntryRepository.findByBusinessIdAndTransactionType(
                businessId, LedgerEntry.TransactionType.PURCHASE, PageRequest.of(0, 10));

        assertThat(purchaseResult.getContent()).isEmpty();
    }
}
