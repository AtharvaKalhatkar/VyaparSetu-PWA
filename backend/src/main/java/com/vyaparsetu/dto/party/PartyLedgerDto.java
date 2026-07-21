package com.vyaparsetu.dto.party;

import com.vyaparsetu.dto.ledger.LedgerEntryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartyLedgerDto {
    private PartyDto party;
    private List<LedgerEntryDto> entries;
    private BigDecimal openingBalance;
    private BigDecimal closingBalance;
}
