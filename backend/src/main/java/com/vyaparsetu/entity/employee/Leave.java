package com.vyaparsetu.entity.employee;

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
import java.util.UUID;

@Entity
@Table(name = "leaves", indexes = {
    @Index(name = "idx_leave_employee", columnList = "businessId, employeeId")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Leave extends TenantEntity {

    @Column(name = "employee_id", nullable = false, columnDefinition = "UUID")
    private UUID employeeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", nullable = false, length = 20)
    private LeaveType leaveType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "total_days", nullable = false)
    private Integer totalDays;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LeaveStatus status;

    @Column(name = "approved_by_id", columnDefinition = "UUID")
    private UUID approvedById;

    @Column(name = "approved_at")
    private Instant approvedAt;

    public enum LeaveType {
        CASUAL, SICK, ANNUAL, UNPAID, MATERNITY, PATERNITY, OTHER
    }

    public enum LeaveStatus {
        PENDING, APPROVED, REJECTED
    }
}
