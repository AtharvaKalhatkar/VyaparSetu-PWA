package com.vyaparsetu.dto.item;

import jakarta.validation.constraints.NotBlank;
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
public class ItemCreateRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String sku;
    private String barcode;
    private String hsnCode;
    private BigDecimal gstRate;
    private UUID categoryId;
    private UUID brandId;
    private UUID unitId;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private BigDecimal mrp;
    private BigDecimal minStockLevel;
    private boolean isBatchTracked;
    private boolean hasExpiry;
    private String taxType;
    private BigDecimal cess;
    private String description;
    private String tags;
    private Object customFields;
    private boolean isService;
}
