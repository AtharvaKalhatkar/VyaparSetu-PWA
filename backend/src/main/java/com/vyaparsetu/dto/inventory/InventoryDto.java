package com.vyaparsetu.dto.inventory;

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
public class InventoryDto {
    private UUID id;
    private UUID itemId;
    private String itemName;
    private String itemSku;
    private UUID warehouseId;
    private String warehouseName;
    private BigDecimal quantity;
    private String batchNo;
    private LocalDate expiryDate;
    private LocalDate mfgDate;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private String location;
}
