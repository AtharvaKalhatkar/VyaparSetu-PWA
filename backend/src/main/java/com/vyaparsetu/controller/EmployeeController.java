package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.dto.employee.AttendanceDto;
import com.vyaparsetu.dto.employee.EmployeeDto;
import com.vyaparsetu.dto.employee.LeaveDto;
import com.vyaparsetu.dto.employee.SalaryDto;
import com.vyaparsetu.service.employee.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/employees")
@RequiredArgsConstructor
@Slf4j
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<EmployeeDto>>> getEmployees(
            @PathVariable UUID businessId,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<EmployeeDto> employees = employeeService.getEmployeesByBusiness(businessId, pageable);
        return ResponseEntity.ok(ApiResponse.success(employees));
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<EmployeeDto>> getEmployeeById(@PathVariable UUID businessId,
                                                                     @PathVariable UUID employeeId) {
        EmployeeDto employee = employeeService.getEmployeeById(businessId, employeeId);
        return ResponseEntity.ok(ApiResponse.success(employee));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeDto>> createEmployee(@PathVariable UUID businessId,
                                                                    @Valid @RequestBody EmployeeDto request) {
        EmployeeDto employee = employeeService.createEmployee(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Employee created", employee));
    }

    @PutMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<EmployeeDto>> updateEmployee(@PathVariable UUID businessId,
                                                                    @PathVariable UUID employeeId,
                                                                    @Valid @RequestBody EmployeeDto request) {
        EmployeeDto employee = employeeService.updateEmployee(businessId, employeeId, request);
        return ResponseEntity.ok(ApiResponse.success("Employee updated", employee));
    }

    @DeleteMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable UUID businessId,
                                                            @PathVariable UUID employeeId) {
        employeeService.deleteEmployee(businessId, employeeId);
        return ResponseEntity.ok(ApiResponse.success("Employee deleted", null));
    }

    @PostMapping("/attendance")
    public ResponseEntity<ApiResponse<AttendanceDto>> markAttendance(@PathVariable UUID businessId,
                                                                      @Valid @RequestBody AttendanceDto request) {
        AttendanceDto attendance = employeeService.markAttendance(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Attendance marked", attendance));
    }

    @GetMapping("/{employeeId}/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceDto>>> getAttendance(
            @PathVariable UUID businessId,
            @PathVariable UUID employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AttendanceDto> attendance = employeeService.getAttendance(businessId, employeeId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(attendance));
    }

    @PostMapping("/{employeeId}/leave")
    public ResponseEntity<ApiResponse<LeaveDto>> applyLeave(@PathVariable UUID businessId,
                                                             @PathVariable UUID employeeId,
                                                             @Valid @RequestBody LeaveDto request) {
        request.setEmployeeId(employeeId);
        LeaveDto leave = employeeService.applyLeave(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Leave applied", leave));
    }

    @PutMapping("/leave/{leaveId}/approve")
    public ResponseEntity<ApiResponse<Void>> approveLeave(@PathVariable UUID businessId,
                                                           @PathVariable UUID leaveId) {
        employeeService.approveLeave(businessId, leaveId);
        return ResponseEntity.ok(ApiResponse.success("Leave approved", null));
    }

    @GetMapping("/{employeeId}/salary")
    public ResponseEntity<ApiResponse<List<SalaryDto>>> getSalary(@PathVariable UUID businessId,
                                                                   @PathVariable UUID employeeId) {
        List<SalaryDto> salaries = employeeService.getEmployeeSalary(businessId, employeeId);
        return ResponseEntity.ok(ApiResponse.success(salaries));
    }

    @PostMapping("/payroll/process")
    public ResponseEntity<ApiResponse<List<SalaryDto>>> processPayroll(@PathVariable UUID businessId,
                                                                        @RequestParam Integer month,
                                                                        @RequestParam Integer year) {
        List<SalaryDto> salaries = employeeService.processPayroll(businessId, month, year);
        return ResponseEntity.ok(ApiResponse.success("Payroll processed", salaries));
    }
}
