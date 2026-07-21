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
public class ItemUpdateRequest {
    private String name;
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
    private Boolean isBatchTracked;
    private Boolean hasExpiry;
    private String taxType;
    private BigDecimal cess;
    private String description;
    private String imageUrl;
    private String tags;
    private Object customFields;
    private Boolean isService;
}
