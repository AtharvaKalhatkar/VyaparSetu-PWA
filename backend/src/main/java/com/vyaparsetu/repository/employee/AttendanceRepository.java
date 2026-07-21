package com.vyaparsetu.repository.employee;

import com.vyaparsetu.entity.employee.Attendance;
import com.vyaparsetu.entity.employee.Attendance.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<Attendance, UUID>, JpaSpecificationExecutor<Attendance> {

    List<Attendance> findByBusinessIdAndEmployeeId(UUID businessId, UUID employeeId);

    Optional<Attendance> findByBusinessIdAndEmployeeIdAndDate(UUID businessId, UUID employeeId, LocalDate date);

    List<Attendance> findByBusinessIdAndEmployeeIdAndDateBetween(UUID businessId, UUID employeeId, LocalDate startDate, LocalDate endDate);

    List<Attendance> findByBusinessIdAndDate(UUID businessId, LocalDate date);

    long countByBusinessIdAndEmployeeIdAndDateBetweenAndStatus(
            UUID businessId, UUID employeeId, LocalDate startDate, LocalDate endDate, AttendanceStatus status);
}
