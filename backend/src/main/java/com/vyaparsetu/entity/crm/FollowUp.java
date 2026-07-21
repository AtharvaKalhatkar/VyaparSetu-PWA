package com.vyaparsetu.entity.crm;

import com.vyaparsetu.common.TenantEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "followups", indexes = {
    @Index(name = "idx_followup_lead", columnList = "businessId, leadId"),
    @Index(name = "idx_followup_date", columnList = "businessId, followUpDate")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class FollowUp extends TenantEntity {

    @Column(name = "lead_id", columnDefinition = "UUID")
    private UUID leadId;

    @Column(name = "party_id", columnDefinition = "UUID")
    private UUID partyId;

    @Column(name = "follow_up_date", nullable = false)
    private LocalDate followUpDate;

    @Column(name = "follow_up_time")
    private LocalTime followUpTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FollowUpType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FollowUpStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "completed_by_id", columnDefinition = "UUID")
    private UUID completedById;

    public enum FollowUpType {
        CALL, MEETING, WHATSAPP, EMAIL, VISIT
    }

    public enum FollowUpStatus {
        PENDING, COMPLETED, CANCELLED, RESCHEDULED
    }
}
