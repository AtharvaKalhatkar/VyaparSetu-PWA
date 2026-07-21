package com.vyaparsetu.entity.ledger;

import com.vyaparsetu.common.TenantEntity;
import com.vyaparsetu.entity.party.Party;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "ledger_entries", indexes = {
    @Index(name = "idx_ledger_business_party", columnList = "businessId, partyId"),
    @Index(name = "idx_ledger_business_date", columnList = "businessId, entryDate"),
    @Index(name = "idx_ledger_business_type", columnList = "businessId, transactionType")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class LedgerEntry extends TenantEntity {

    @Column(name = "party_id", nullable = false, columnDefinition = "UUID")
    private UUID partyId;

    @Column(name = "invoice_id", columnDefinition = "UUID")
    private UUID invoiceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private TransactionType transactionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 10)
    private EntryType entryType;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "balance_after", precision = 15, scale = 2)
    private BigDecimal balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentMode mode;

    @Column(length = 100)
    private String reference;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "is_reconciled", nullable = false)
    @Builder.Default
    private boolean isReconciled = false;

    @Column(name = "reconciled_at")
    private Instant reconciledAt;

    @Column(name = "invoice_no", length = 50)
    private String invoiceNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "party_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Party party;

    public enum TransactionType {
        SALE, PURCHASE, PAYMENT, RECEIPT, EXPENSE, CONTRA,
        JOURNAL, CREDIT_NOTE, DEBIT_NOTE, OPENING_BALANCE
    }

    public enum EntryType {
        DEBIT, CREDIT
    }

    public enum PaymentMode {
        CASH, BANK, UPI, CARD, CHEQUE, CREDIT, ONLINE
    }
}
