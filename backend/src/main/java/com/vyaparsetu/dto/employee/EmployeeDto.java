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
public class EmployeeDto {
    private UUID id;
    private String employeeCode;
    private String fullName;
    private String phone;
    private String email;
    private String department;
    private String designation;
    private LocalDate joiningDate;
    private BigDecimal salary;
    private BigDecimal commissionPercent;
    private String workType;
    private boolean isActive;
}
