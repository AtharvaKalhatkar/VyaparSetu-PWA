package com.vyaparsetu.entity.party;

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

@Entity
@Table(name = "parties", indexes = {
    @Index(name = "idx_party_business_phone", columnList = "businessId, phone"),
    @Index(name = "idx_party_business_type", columnList = "businessId, type"),
    @Index(name = "idx_party_business_name", columnList = "businessId, name")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Party extends TenantEntity {

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 20)
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PartyType type;

    @Column(name = "party_type", length = 30)
    private String partyType;

    @Column(name = "opening_balance", precision = 15, scale = 2)
    private BigDecimal openingBalance;

    @Enumerated(EnumType.STRING)
    @Column(name = "balance_type", length = 10)
    private BalanceType balanceType;

    @Column(name = "credit_limit", precision = 15, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "credit_days")
    private Integer creditDays;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_category", length = 20)
    private PriceCategory priceCategory;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 500)
    private String tags;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(name = "gps_latitude")
    private Double gpsLatitude;

    @Column(name = "gps_longitude")
    private Double gpsLongitude;

    @JdbcTypeCode(SqlTypes.JSON)
    private String customFields;

    @Column(name = "photo_url")
    private String photoUrl;

    public enum PartyType {
        CUSTOMER, SUPPLIER, BOTH
    }

    public enum BalanceType {
        DEBIT, CREDIT
    }

    public enum PriceCategory {
        WHOLESALE, RETAIL, DISTRIBUTOR
    }
}

