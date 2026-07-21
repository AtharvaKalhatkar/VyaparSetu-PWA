package com.vyaparsetu.dto.ledger;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class LedgerEntryRequest {
    @NotNull
    private UUID partyId;
    @NotBlank
    private String transactionType;
    @NotBlank
    private String entryType;
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal amount;
    private String mode;
    private String reference;
    private String note;
    private LocalDate entryDate;
    private LocalDate dueDate;
    private String invoiceNo;
}
