package com.vyaparsetu.entity.crm;

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
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "crm_leads", indexes = {
    @Index(name = "idx_lead_business_status", columnList = "businessId, status"),
    @Index(name = "idx_lead_assigned_to", columnList = "businessId, assignedToId")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class CrmLead extends TenantEntity {

    @Column(name = "party_id", columnDefinition = "UUID")
    private UUID partyId;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "lead_source", length = 30)
    private LeadSource leadSource;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LeadStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private LeadPriority priority;

    @Column(name = "assigned_to_id", columnDefinition = "UUID")
    private UUID assignedToId;

    @Column(name = "expected_value", precision = 15, scale = 2)
    private BigDecimal expectedValue;

    @Column
    private Integer probability;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    private String customFields;

    @Column(name = "converted_at")
    private Instant convertedAt;

    @Column(name = "converted_to_party_id", columnDefinition = "UUID")
    private UUID convertedToPartyId;

    public enum LeadSource {
        REFERRAL, WEBSITE, SOCIAL_MEDIA, COLD_CALL, WALK_IN, WHATSAPP, OTHER
    }

    public enum LeadStatus {
        NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST, DROPPED
    }

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    public enum LeadPriority {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}

