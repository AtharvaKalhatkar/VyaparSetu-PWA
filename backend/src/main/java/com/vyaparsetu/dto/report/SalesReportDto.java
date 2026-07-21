package com.vyaparsetu.dto.report;

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
public class SalesReportDto {
    private String period;
    private long totalInvoices;
    private BigDecimal totalSales;
    private BigDecimal totalTax;
    private BigDecimal discountGiven;
    private BigDecimal averageInvoiceValue;
    private Map<String, BigDecimal> paymentModeBreakdown;
    private List<Map<String, Object>> dailyBreakdown;
}
