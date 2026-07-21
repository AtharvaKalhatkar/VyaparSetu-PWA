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
public class GstReportDto {
    private String period;
    private BigDecimal totalOutputGst;
    private BigDecimal totalInputGst;
    private BigDecimal netGstPayable;
    private List<Map<String, Object>> hsnWiseSummary;
    private List<Map<String, Object>> invoiceWise;
}
