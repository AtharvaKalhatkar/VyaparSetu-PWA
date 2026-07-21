package com.vyaparsetu.entity.inventory;

import com.vyaparsetu.common.TenantEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "stock_movements", indexes = {
    @Index(name = "idx_stock_business_item", columnList = "businessId, itemId"),
    @Index(name = "idx_stock_reference", columnList = "businessId, referenceType, referenceId")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class StockMovement extends TenantEntity {

    @Column(name = "item_id", nullable = false, columnDefinition = "UUID")
    private UUID itemId;

    @Column(name = "warehouse_id", nullable = false, columnDefinition = "UUID")
    private UUID warehouseId;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 30)
    private MovementType movementType;

    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal quantity;

    @Column(name = "batch_no", length = 100)
    private String batchNo;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "mfg_date")
    private LocalDate mfgDate;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id", columnDefinition = "UUID")
    private UUID referenceId;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    public enum MovementType {
        STOCK_IN, STOCK_OUT, TRANSFER_IN, TRANSFER_OUT, DAMAGE,
        AUDIT_ADJUSTMENT, SALE, PURCHASE, RETURN_IN, RETURN_OUT
    }
}
