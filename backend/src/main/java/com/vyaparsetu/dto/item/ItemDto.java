package com.vyaparsetu.dto.item;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemDto {
    private UUID id;
    private String name;
    private String sku;
    private String barcode;
    private String hsnCode;
    private BigDecimal gstRate;
    private CategoryDto category;
    private BrandDto brand;
    private UnitDto unit;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private BigDecimal mrp;
    private BigDecimal minStockLevel;
    private BigDecimal currentStock;
    private boolean isBatchTracked;
    private boolean hasExpiry;
    private boolean isActive;
    private String taxType;
    private BigDecimal cess;
    private String description;
    private String imageUrl;
    private String tags;
    private Object customFields;
    private boolean isService;
    private BigDecimal stockValue;
    private Instant createdAt;
    private Instant updatedAt;
}
