package com.vyaparsetu.service.employee;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.BadRequestException;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.employee.AttendanceDto;
import com.vyaparsetu.dto.employee.EmployeeDto;
import com.vyaparsetu.dto.employee.LeaveDto;
import com.vyaparsetu.dto.employee.SalaryDto;
import com.vyaparsetu.dto.mapper.EmployeeMapper;
import com.vyaparsetu.entity.employee.Attendance;
import com.vyaparsetu.entity.employee.Attendance.AttendanceStatus;
import com.vyaparsetu.entity.employee.Employee;
import com.vyaparsetu.entity.employee.Leave;
import com.vyaparsetu.entity.employee.Leave.LeaveStatus;
import com.vyaparsetu.entity.employee.Salary;
import com.vyaparsetu.entity.employee.Salary.SalaryStatus;
import com.vyaparsetu.repository.employee.AttendanceRepository;
import com.vyaparsetu.repository.employee.EmployeeRepository;
import com.vyaparsetu.repository.employee.LeaveRepository;
import com.vyaparsetu.repository.employee.SalaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRepository leaveRepository;
    private final SalaryRepository salaryRepository;
    private final EmployeeMapper employeeMapper;
    private final AuditService auditService;

    @Transactional
    public EmployeeDto createEmployee(UUID businessId, EmployeeDto request) {
        log.info("Creating employee in business: {}", businessId);

        Employee employee = Employee.builder()
                .businessId(businessId)
                .employeeCode(request.getEmployeeCode())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .department(request.getDepartment())
                .designation(request.getDesignation())
                .joiningDate(request.getJoiningDate() != null ? request.getJoiningDate() : LocalDate.now())
                .salary(request.getSalary())
                .commissionPercent(request.getCommissionPercent())
                .workType(request.getWorkType() != null ? Employee.WorkType.valueOf(request.getWorkType().toUpperCase()) : null)
                .isActive(true)
                .build();
        employee = employeeRepository.save(employee);

        auditService.logEvent(businessId.toString(), "CREATE_EMPLOYEE", "Employee", employee.getId(),
                null, Map.of("name", employee.getFullName(), "code", employee.getEmployeeCode()));

        return employeeMapper.toDto(employee);
    }

    @Transactional
    public EmployeeDto updateEmployee(UUID businessId, UUID employeeId, EmployeeDto request) {
        log.info("Updating employee: {} in business: {}", employeeId, businessId);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        if (request.getEmployeeCode() != null) employee.setEmployeeCode(request.getEmployeeCode());
        if (request.getFullName() != null) employee.setFullName(request.getFullName());
        if (request.getPhone() != null) employee.setPhone(request.getPhone());
        if (request.getEmail() != null) employee.setEmail(request.getEmail());
        if (request.getDepartment() != null) employee.setDepartment(request.getDepartment());
        if (request.getDesignation() != null) employee.setDesignation(request.getDesignation());
        if (request.getJoiningDate() != null) employee.setJoiningDate(request.getJoiningDate());
        if (request.getSalary() != null) employee.setSalary(request.getSalary());
        if (request.getCommissionPercent() != null) employee.setCommissionPercent(request.getCommissionPercent());
        if (request.getWorkType() != null) employee.setWorkType(Employee.WorkType.valueOf(request.getWorkType().toUpperCase()));

        employee = employeeRepository.save(employee);

        auditService.logEvent(businessId.toString(), "UPDATE_EMPLOYEE", "Employee", employeeId,
                null, Map.of("name", employee.getFullName()));

        return employeeMapper.toDto(employee);
    }

    @Transactional
    public void deleteEmployee(UUID businessId, UUID employeeId) {
        log.info("Deleting employee: {} in business: {}", employeeId, businessId);

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        employee.setIsActive(false);
        employeeRepository.save(employee);

        auditService.logEvent(businessId.toString(), "DELETE_EMPLOYEE", "Employee", employeeId, null, null);
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployeeById(UUID businessId, UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
        return employeeMapper.toDto(employee);
    }

    @Transactional(readOnly = true)
    public PagedResponse<EmployeeDto> getEmployeesByBusiness(UUID businessId, Pageable pageable) {
        Page<Employee> employeePage = employeeRepository.findByBusinessId(businessId, pageable);
        List<EmployeeDto> dtos = employeeMapper.toDtoList(employeePage.getContent());
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                employeePage.getTotalElements());
    }

    @Transactional
    public AttendanceDto markAttendance(UUID businessId, AttendanceDto request) {
        log.info("Marking attendance in business: {}", businessId);

        Attendance attendance = Attendance.builder()
                .businessId(businessId)
                .employeeId(request.getEmployeeId())
                .date(request.getDate() != null ? request.getDate() : LocalDate.now())
                .checkIn(request.getCheckIn() != null ? request.getCheckIn() : Instant.now())
                .checkOut(request.getCheckOut())
                .status(request.getStatus() != null ? AttendanceStatus.valueOf(request.getStatus().toUpperCase()) : AttendanceStatus.PRESENT)
                .gpsLatitude(request.getGpsLatitude())
                .gpsLongitude(request.getGpsLongitude())
                .note(request.getNote())
                .build();
        attendance = attendanceRepository.save(attendance);

        return toAttendanceDto(attendance);
    }

    @Transactional
    public LeaveDto applyLeave(UUID businessId, LeaveDto request) {
        log.info("Applying leave in business: {}", businessId);
        Leave leave = Leave.builder()
                .businessId(businessId)
                .employeeId(request.getEmployeeId())
                .leaveType(request.getLeaveType() != null ? Leave.LeaveType.valueOf(request.getLeaveType().toUpperCase()) : Leave.LeaveType.CASUAL)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalDays(request.getTotalDays())
                .reason(request.getReason())
                .status(LeaveStatus.PENDING)
                .build();
        leave = leaveRepository.save(leave);
        return LeaveDto.builder()
                .id(leave.getId())
                .employeeId(leave.getEmployeeId())
                .leaveType(leave.getLeaveType() != null ? leave.getLeaveType().name() : null)
                .startDate(leave.getStartDate())
                .endDate(leave.getEndDate())
                .totalDays(leave.getTotalDays())
                .reason(leave.getReason())
                .status(leave.getStatus() != null ? leave.getStatus().name() : null)
                .approvedBy(leave.getApprovedById())
                .build();
    }

    @Transactional(readOnly = true)
    public List<SalaryDto> getEmployeeSalary(UUID businessId, UUID employeeId) {
        List<Salary> salaries = salaryRepository.findByBusinessIdAndEmployeeId(businessId, employeeId);
        return salaries.stream().map(s -> SalaryDto.builder()
                .id(s.getId())
                .employeeId(s.getEmployeeId())
                .month(s.getMonth())
                .year(s.getYear())
                .basicSalary(s.getBasicSalary())
                .grossPay(s.getGrossPay())
                .netPay(s.getNetPay())
                .status(s.getStatus() != null ? s.getStatus().name() : null)
                .build()).toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceDto> getAttendance(UUID businessId, UUID employeeId,
                                              LocalDate startDate, LocalDate endDate) {
        List<Attendance> attendanceList = attendanceRepository
                .findByBusinessIdAndEmployeeIdAndDateBetween(businessId, employeeId, startDate, endDate);
        return attendanceList.stream().map(this::toAttendanceDto).toList();
    }

    @Transactional
    public void approveLeave(UUID businessId, UUID leaveId) {
        log.info("Approving leave: {} in business: {}", leaveId, businessId);

        Leave leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave", leaveId));
        leave.setStatus(LeaveStatus.APPROVED);
        leave.setApprovedAt(Instant.now());
        leaveRepository.save(leave);
    }

    @Transactional
    public List<SalaryDto> processPayroll(UUID businessId, Integer month, Integer year) {
        log.info("Processing payroll for business: {}, month: {}, year: {}", businessId, month, year);

        List<Employee> employees = employeeRepository.findByBusinessIdAndIsActiveTrue(businessId);
        List<SalaryDto> salaryDtos = new ArrayList<>();

        for (Employee employee : employees) {
            salaryRepository.findByBusinessIdAndEmployeeIdAndMonthAndYear(businessId, employee.getId(), month, year)
                    .ifPresent(s -> { throw new BadRequestException("Salary already processed for employee: " + employee.getId()); });

            BigDecimal basicSalary = employee.getSalary() != null ? employee.getSalary() : BigDecimal.ZERO;
            BigDecimal grossPay = basicSalary;
            BigDecimal netPay = grossPay;

            Salary salary = Salary.builder()
                    .businessId(businessId)
                    .employeeId(employee.getId())
                    .month(month)
                    .year(year)
                    .basicSalary(basicSalary)
                    .grossPay(grossPay)
                    .netPay(netPay)
                    .status(SalaryStatus.PENDING)
                    .build();
            salary = salaryRepository.save(salary);

            salaryDtos.add(SalaryDto.builder()
                    .id(salary.getId())
                    .employeeId(salary.getEmployeeId())
                    .employeeName(employee.getFullName())
                    .month(salary.getMonth())
                    .year(salary.getYear())
                    .basicSalary(salary.getBasicSalary())
                    .grossPay(salary.getGrossPay())
                    .netPay(salary.getNetPay())
                    .status(salary.getStatus() != null ? salary.getStatus().name() : null)
                    .build());
        }

        auditService.logEvent(businessId.toString(), "PROCESS_PAYROLL", "Salary", null,
                null, Map.of("month", month.toString(), "year", year.toString(), "count", String.valueOf(employees.size())));

        return salaryDtos;
    }

    private AttendanceDto toAttendanceDto(Attendance attendance) {
        String employeeName = employeeRepository.findById(attendance.getEmployeeId())
                .map(Employee::getFullName).orElse(null);

        return AttendanceDto.builder()
                .id(attendance.getId())
                .employeeId(attendance.getEmployeeId())
                .employeeName(employeeName)
                .date(attendance.getDate())
                .checkIn(attendance.getCheckIn())
                .checkOut(attendance.getCheckOut())
                .status(attendance.getStatus() != null ? attendance.getStatus().name() : null)
                .gpsLatitude(attendance.getGpsLatitude())
                .gpsLongitude(attendance.getGpsLongitude())
                .note(attendance.getNote())
                .build();
    }
}
