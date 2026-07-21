package com.vyaparsetu.dto.party;

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
public class PartyBalanceDto {
    private UUID partyId;
    private String partyName;
    private String phone;
    private BigDecimal currentBalance;
    private String balanceType;
    private BigDecimal totalDue;
    private BigDecimal totalOverdue;
    private BigDecimal creditLimit;
    private LocalDate asOfDate;
}
