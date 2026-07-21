package com.vyaparsetu.entity.business;

import com.vyaparsetu.common.TenantEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
@Entity
@Table(name = "financial_years", indexes = {
    @Index(name = "idx_fy_business", columnList = "businessId")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class FinancialYear extends TenantEntity {

    @Column(name = "year_start", nullable = false)
    private LocalDate yearStart;

    @Column(name = "year_end", nullable = false)
    private LocalDate yearEnd;

    @Column(nullable = false, length = 20)
    private String name;

    @Column(name = "is_current", nullable = false)
    @Builder.Default
    private boolean isCurrent = false;

    @Column(name = "is_closed", nullable = false)
    @Builder.Default
    private boolean isClosed = false;
}
