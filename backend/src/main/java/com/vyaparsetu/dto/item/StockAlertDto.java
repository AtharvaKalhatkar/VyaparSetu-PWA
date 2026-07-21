package com.vyaparsetu.dto.item;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAlertDto {
    private UUID itemId;
    private String itemName;
    private String sku;
    private BigDecimal currentStock;
    private BigDecimal minStockLevel;
    private String warehouseName;
    private BigDecimal difference;
}
