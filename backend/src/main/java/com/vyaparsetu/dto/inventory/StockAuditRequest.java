package com.vyaparsetu.dto.inventory;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAuditRequest {
    @NotNull
    private UUID warehouseId;
    @NotNull
    private List<AuditItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditItem {
        private UUID itemId;
        private BigDecimal expectedQty;
        private BigDecimal actualQty;
        private BigDecimal difference;
    }
}
