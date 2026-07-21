package com.vyaparsetu.entity.ledger;

import com.vyaparsetu.common.TenantEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "ledger_balances", indexes = {
    @Index(name = "idx_ledger_balance_business_party", columnList = "businessId, partyId", unique = true)
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class LedgerBalance extends TenantEntity {

    @Column(name = "party_id", nullable = false, columnDefinition = "UUID")
    private UUID partyId;

    @Column(name = "current_balance", precision = 15, scale = 2)
    private BigDecimal currentBalance;

    @Enumerated(EnumType.STRING)
    @Column(name = "balance_type", length = 10)
    private BalanceType balanceType;

    @Column(name = "last_entry_date")
    private Instant lastEntryDate;

    @Column(name = "total_due", precision = 15, scale = 2)
    private BigDecimal totalDue;

    @Column(name = "total_overdue", precision = 15, scale = 2)
    private BigDecimal totalOverdue;

    @Column(name = "credit_limit", precision = 15, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "as_of_date")
    private LocalDate asOfDate;

    public enum BalanceType {
        DEBIT, CREDIT
    }
}
