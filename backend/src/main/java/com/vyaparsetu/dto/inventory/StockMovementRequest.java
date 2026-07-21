package com.vyaparsetu.dto.inventory;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class StockMovementRequest {
    @NotNull
    private UUID itemId;
    @NotNull
    private UUID warehouseId;
    @NotBlank
    private String movementType;
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal quantity;
    private String batchNo;
    private LocalDate expiryDate;
    private LocalDate mfgDate;
    private String referenceType;
    private UUID referenceId;
    private String note;
    private BigDecimal unitPrice;
}
