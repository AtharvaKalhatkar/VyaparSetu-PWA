package com.vyaparsetu.entity.expense;

import com.vyaparsetu.common.TenantEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "expenses", indexes = {
    @Index(name = "idx_expense_business_date", columnList = "businessId, expenseDate"),
    @Index(name = "idx_expense_business_category", columnList = "businessId, category")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Expense extends TenantEntity {

    @Column(name = "expense_no", length = 50)
    private String expenseNo;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExpenseCategory category;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", length = 20)
    private PaymentMode paymentMode;

    @Column(name = "paid_to", length = 200)
    private String paidTo;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String reference;

    @Column(name = "receipt_url")
    private String receiptUrl;

    @Column(name = "is_billable", nullable = false)
    @Builder.Default
    private boolean isBillable = false;

    @Column(name = "approved_by_id", columnDefinition = "UUID")
    private UUID approvedById;

    public enum ExpenseCategory {
        FUEL, SALARY, ELECTRICITY, RENT, TRANSPORTATION,
        OFFICE_EXPENSE, MISCELLANEOUS, OTHER
    }

    public enum PaymentMode {
        CASH, BANK, UPI, CARD, CHEQUE, ONLINE
    }
}
