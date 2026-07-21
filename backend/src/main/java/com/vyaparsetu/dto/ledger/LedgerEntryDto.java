package com.vyaparsetu.dto.ledger;

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
public class LedgerEntryDto {
    private UUID id;
    private UUID partyId;
    private String partyName;
    private UUID invoiceId;
    private String transactionType;
    private String entryType;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String mode;
    private String reference;
    private String note;
    private LocalDate entryDate;
    private LocalDate dueDate;
    private String invoiceNo;
    private Instant createdAt;
}
