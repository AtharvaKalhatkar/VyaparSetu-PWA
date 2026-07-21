package com.vyaparsetu.repository.employee;

import com.vyaparsetu.entity.employee.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID>, JpaSpecificationExecutor<Employee> {

    Page<Employee> findByBusinessId(UUID businessId, Pageable pageable);

    List<Employee> findByBusinessIdAndIsActiveTrue(UUID businessId);

    Optional<Employee> findByBusinessIdAndEmployeeCode(UUID businessId, String employeeCode);

    Page<Employee> findByBusinessIdAndDepartment(UUID businessId, String department, Pageable pageable);
}
