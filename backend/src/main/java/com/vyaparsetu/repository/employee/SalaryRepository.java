package com.vyaparsetu.repository.employee;

import com.vyaparsetu.entity.employee.Salary;
import com.vyaparsetu.entity.employee.Salary.SalaryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SalaryRepository extends JpaRepository<Salary, UUID>, JpaSpecificationExecutor<Salary> {

    List<Salary> findByBusinessIdAndEmployeeId(UUID businessId, UUID employeeId);

    Optional<Salary> findByBusinessIdAndEmployeeIdAndMonthAndYear(
            UUID businessId, UUID employeeId, Integer month, Integer year);

    List<Salary> findByBusinessIdAndMonthAndYear(UUID businessId, Integer month, Integer year);

    List<Salary> findByBusinessIdAndStatus(UUID businessId, SalaryStatus status);
}
