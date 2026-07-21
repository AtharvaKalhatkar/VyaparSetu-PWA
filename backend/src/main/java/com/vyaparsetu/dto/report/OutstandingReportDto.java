package com.vyaparsetu.dto.report;

import com.vyaparsetu.dto.ledger.OutstandingDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutstandingReportDto {
    private BigDecimal totalOutstanding;
    private List<OutstandingDto> partyWise;
    private Map<String, BigDecimal> agingSummary;
}
