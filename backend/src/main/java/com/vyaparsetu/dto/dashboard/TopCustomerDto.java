package com.vyaparsetu.dto.dashboard;

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
public class TopCustomerDto {
    private UUID partyId;
    private String partyName;
    private BigDecimal totalSales;
    private BigDecimal totalOutstanding;
    private LocalDate lastTransactionDate;
}
