package com.vyaparsetu.dto.employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryDto {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private Integer month;
    private Integer year;
    private BigDecimal basicSalary;
    private Object allowances;
    private Object deductions;
    private BigDecimal grossPay;
    private BigDecimal netPay;
    private String status;
    private LocalDate paidDate;
    private String paymentMode;
}
