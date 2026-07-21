package com.vyaparsetu.dto.ledger;

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
public class OutstandingDto {
    private UUID partyId;
    private String partyName;
    private String phone;
    private BigDecimal totalOutstanding;
    private BigDecimal overdueAmount;
    private Integer daysOverdue;
    private BigDecimal creditLimit;
    private LocalDate lastTransactionDate;
}
