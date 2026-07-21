package com.vyaparsetu.entity.item;

import com.vyaparsetu.common.TenantEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "items", indexes = {
    @Index(name = "idx_item_business_sku", columnList = "businessId, sku"),
    @Index(name = "idx_item_business_barcode", columnList = "businessId, barcode"),
    @Index(name = "idx_item_business_category", columnList = "businessId, categoryId")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Item extends TenantEntity {

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 50)
    private String sku;

    @Column(length = 100)
    private String barcode;

    @Column(name = "hsn_code", length = 20)
    private String hsnCode;

    @Column(name = "gst_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal gstRate = BigDecimal.ZERO;

    @Column(name = "category_id", columnDefinition = "UUID")
    private UUID categoryId;

    @Column(name = "brand_id", columnDefinition = "UUID")
    private UUID brandId;

    @Column(name = "unit_id", columnDefinition = "UUID")
    private UUID unitId;

    @Column(name = "purchase_price", precision = 15, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "selling_price", precision = 15, scale = 2)
    private BigDecimal sellingPrice;

    @Column(precision = 15, scale = 2)
    private BigDecimal mrp;

    @Column(name = "min_stock_level", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal minStockLevel = BigDecimal.ZERO;

    @Column(name = "max_stock_level", precision = 15, scale = 2)
    private BigDecimal maxStockLevel;

    @Column(name = "current_stock", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(name = "stock_location", length = 100)
    private String stockLocation;

    @Column(name = "is_batch_tracked", nullable = false)
    @Builder.Default
    private boolean isBatchTracked = false;

    @Column(name = "has_expiry", nullable = false)
    @Builder.Default
    private boolean hasExpiry = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "tax_type", length = 10)
    private TaxType taxType;

    @Column(precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal cess = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(length = 500)
    private String tags;

    @JdbcTypeCode(SqlTypes.JSON)
    private String customFields;

    @Column(precision = 15, scale = 3)
    private BigDecimal weight;

    @Column(name = "weight_unit", length = 10)
    private String weightUnit;

    @Column(name = "is_service", nullable = false)
    @Builder.Default
    private boolean isService = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Unit unit;

    public enum TaxType {
        GST, IGST, EXEMPT, NONE
    }
}

