package com.vyaparsetu.repository.ledger;

import com.vyaparsetu.entity.ledger.LedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID>, JpaSpecificationExecutor<LedgerEntry> {

    Page<LedgerEntry> findByBusinessId(UUID businessId, Pageable pageable);

    List<LedgerEntry> findByBusinessIdAndPartyIdOrderByEntryDateDesc(UUID businessId, UUID partyId);

    Page<LedgerEntry> findByBusinessIdAndPartyId(UUID businessId, UUID partyId, Pageable pageable);

    List<LedgerEntry> findByBusinessIdAndEntryDateBetween(UUID businessId, LocalDate startDate, LocalDate endDate);

    Page<LedgerEntry> findByBusinessIdAndTransactionType(UUID businessId, LedgerEntry.TransactionType transactionType, Pageable pageable);

    @Query("SELECT COALESCE(SUM(CASE WHEN l.entryType = 'DEBIT' THEN l.amount ELSE -l.amount END), 0) " +
           "FROM LedgerEntry l WHERE l.businessId = :businessId AND l.partyId = :partyId")
    BigDecimal calculateBalanceByPartyId(@Param("businessId") UUID businessId, @Param("partyId") UUID partyId);

    @Query("SELECT l.partyId, COALESCE(SUM(CASE WHEN l.entryType = 'DEBIT' THEN l.amount ELSE -l.amount END), 0) " +
           "FROM LedgerEntry l WHERE l.businessId = :businessId GROUP BY l.partyId")
    List<Object[]> getOutstandingByBusinessId(@Param("businessId") UUID businessId);
}
