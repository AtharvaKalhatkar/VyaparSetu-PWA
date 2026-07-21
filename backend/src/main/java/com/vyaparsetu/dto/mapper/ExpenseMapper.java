package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.expense.ExpenseDto;
import com.vyaparsetu.entity.expense.Expense;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ExpenseMapper {

    @Mapping(target = "category", expression = "java(expense.getCategory() != null ? expense.getCategory().name() : null)")
    @Mapping(target = "paymentMode", expression = "java(expense.getPaymentMode() != null ? expense.getPaymentMode().name() : null)")
    ExpenseDto toDto(Expense expense);

    List<ExpenseDto> toDtoList(List<Expense> expenses);
}
