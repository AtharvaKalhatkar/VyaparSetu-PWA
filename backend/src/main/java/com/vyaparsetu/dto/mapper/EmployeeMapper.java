package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.employee.EmployeeDto;
import com.vyaparsetu.entity.employee.Employee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface EmployeeMapper {

    @Mapping(target = "workType", expression = "java(employee.getWorkType() != null ? employee.getWorkType().name() : null)")
    EmployeeDto toDto(Employee employee);

    List<EmployeeDto> toDtoList(List<Employee> employees);
}
