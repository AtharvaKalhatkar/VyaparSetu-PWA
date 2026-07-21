package com.vyaparsetu.dto.ledger;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerSummaryDto {
    private BigDecimal totalDebits;
    private BigDecimal totalCredits;
    private BigDecimal openingBalance;
    private BigDecimal closingBalance;
    private Long partyCount;
    private String period;
}
