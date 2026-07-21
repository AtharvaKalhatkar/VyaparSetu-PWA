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

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "units", indexes = {
    @Index(name = "idx_unit_business_short_name", columnList = "businessId, shortName", unique = true)
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Unit extends TenantEntity {

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "short_name", nullable = false, length = 10)
    private String shortName;

    @Column(name = "base_unit_id", columnDefinition = "UUID")
    private UUID baseUnitId;

    @Column(name = "conversion_factor", precision = 15, scale = 6)
    @Builder.Default
    private BigDecimal conversionFactor = BigDecimal.ONE;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_type", length = 20)
    private UnitType unitType;

    public enum UnitType {
        WEIGHT, VOLUME, LENGTH, COUNT, AREA, TIME, OTHER
    }
}
