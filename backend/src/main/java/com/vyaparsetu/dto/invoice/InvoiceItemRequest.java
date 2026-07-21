package com.vyaparsetu.dto.invoice;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItemRequest {
    @NotNull
    private UUID itemId;
    private String description;
    @NotNull
    @Positive
    private BigDecimal quantity;
    private String unit;
    @NotNull
    @Positive
    private BigDecimal rate;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal gstRate;
    private String batchNo;
    private LocalDate expiryDate;
}
