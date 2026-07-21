package com.vyaparsetu.dto.report;

import com.vyaparsetu.dto.item.StockAlertDto;
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
public class StockReportDto {
    private long totalItems;
    private BigDecimal totalStockValue;
    private List<StockAlertDto> lowStockItems;
    private List<Map<String, Object>> categoryWiseStock;
}
