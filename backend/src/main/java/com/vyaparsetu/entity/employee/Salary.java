package com.vyaparsetu.entity.employee;

import com.vyaparsetu.common.TenantEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "salaries", indexes = {
    @Index(name = "idx_salary_employee_month", columnList = "businessId, employeeId, salary_month, salary_year")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Salary extends TenantEntity {

    @Column(name = "employee_id", nullable = false, columnDefinition = "UUID")
    private UUID employeeId;

    @Column(name = "salary_month", nullable = false)
    private Integer month;

    @Column(name = "salary_year", nullable = false)
    private Integer year;

    @Column(name = "basic_salary", precision = 15, scale = 2)
    private BigDecimal basicSalary;

    @JdbcTypeCode(SqlTypes.JSON)
    private String allowances;

    @JdbcTypeCode(SqlTypes.JSON)
    private String deductions;

    @Column(name = "gross_pay", precision = 15, scale = 2)
    private BigDecimal grossPay;

    @Column(name = "net_pay", precision = 15, scale = 2)
    private BigDecimal netPay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SalaryStatus status;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Column(name = "payment_mode", length = 50)
    private String paymentMode;

    @Column(name = "transaction_ref", length = 100)
    private String transactionRef;

    public enum SalaryStatus {
        PENDING, PAID, CANCELLED
    }
}

