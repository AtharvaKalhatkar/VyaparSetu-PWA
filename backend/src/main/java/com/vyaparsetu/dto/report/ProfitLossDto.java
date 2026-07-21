package com.vyaparsetu.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfitLossDto {
    private String period;
    private BigDecimal totalRevenue;
    private BigDecimal totalPurchases;
    private BigDecimal totalExpenses;
    private BigDecimal grossProfit;
    private BigDecimal netProfit;
    private Map<String, BigDecimal> expenseBreakdown;
}
