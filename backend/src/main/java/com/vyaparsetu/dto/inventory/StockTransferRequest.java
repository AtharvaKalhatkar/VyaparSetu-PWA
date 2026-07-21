package com.vyaparsetu.dto.inventory;

import jakarta.validation.constraints.NotNull;
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
public class StockTransferRequest {
    @NotNull
    private UUID fromWarehouseId;
    @NotNull
    private UUID toWarehouseId;
    @NotNull
    private UUID itemId;
    @NotNull
    private BigDecimal quantity;
    private String note;
}
