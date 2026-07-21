package com.vyaparsetu.dto.expense;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseCreateRequest {
    private LocalDate expenseDate;
    private String category;
    @NotNull
    @Positive
    private BigDecimal amount;
    private String paymentMode;
    private String paidTo;
    private String description;
    private String reference;
    private boolean isBillable;
}
