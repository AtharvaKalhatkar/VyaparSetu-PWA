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
import org.hibernate.type.SqlTypes;
import org.hibernate.annotations.JdbcTypeCode;

import java.time.MonthDay;

@Entity
@Table(name = "businesses", indexes = {
    @Index(name = "idx_business_gstin", columnList = "gstin", unique = true),
    @Index(name = "idx_business_type", columnList = "businessType")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Business extends TenantEntity {

    @PrePersist
    protected void onPrePersist() {
        if (getBusinessId() == null) {
            setBusinessId(getId());
        }
    }

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "business_type", nullable = false, length = 30)
    private String businessType;

    @Column(length = 20, unique = true)
    private String gstin;

    @Column(length = 20)
    private String pan;

    @Column(length = 255)
    private String addressLine1;

    @Column(length = 255)
    private String addressLine2;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 10)
    private String pincode;

    @Column(length = 100, nullable = false)
    @Builder.Default
    private String country = "India";

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 255)
    private String website;

    @Column(name = "logo")
    private String logo;

    @Column(name = "financial_year_start")
    private MonthDay financialYearStart;

    @Column(name = "financial_year_end")
    private MonthDay financialYearEnd;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_gst_enabled", nullable = false)
    @Builder.Default
    private boolean isGstEnabled = false;

    @JdbcTypeCode(SqlTypes.JSON)
    private String config;

    @JdbcTypeCode(SqlTypes.JSON)
    private String settings;
}

