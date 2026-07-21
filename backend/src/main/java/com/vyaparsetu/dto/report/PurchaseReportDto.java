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
public class PurchaseReportDto {
    private String period;
    private BigDecimal totalPurchases;
    private BigDecimal totalTax;
    private List<Map<String, Object>> topSuppliers;
}
