package com.vyaparsetu.repository.employee;

import com.vyaparsetu.entity.employee.Leave;
import com.vyaparsetu.entity.employee.Leave.LeaveStatus;
import com.vyaparsetu.entity.employee.Leave.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface LeaveRepository extends JpaRepository<Leave, UUID>, JpaSpecificationExecutor<Leave> {

    List<Leave> findByBusinessIdAndEmployeeId(UUID businessId, UUID employeeId);

    List<Leave> findByBusinessIdAndEmployeeIdAndStatus(UUID businessId, UUID employeeId, LeaveStatus status);

    List<Leave> findByBusinessIdAndEmployeeIdAndStartDateBetween(
            UUID businessId, UUID employeeId, LocalDate startDate, LocalDate endDate);

    List<Leave> findByBusinessIdAndStatus(UUID businessId, LeaveStatus status);
}
