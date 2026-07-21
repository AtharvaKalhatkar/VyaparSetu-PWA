package com.vyaparsetu.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementDto {
    private UUID id;
    private UUID itemId;
    private String itemName;
    private UUID warehouseId;
    private String warehouseName;
    private String movementType;
    private BigDecimal quantity;
    private String batchNo;
    private LocalDate expiryDate;
    private String referenceType;
    private UUID referenceId;
    private String note;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private Instant createdAt;
}
