package com.vyaparsetu.dto.expense;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseDto {
    private UUID id;
    private String expenseNo;
    private LocalDate expenseDate;
    private String category;
    private BigDecimal amount;
    private String paymentMode;
    private String paidTo;
    private String description;
    private String reference;
    private String receiptUrl;
    private boolean isBillable;
    private String approvedBy;
    private Instant createdAt;
}
