package com.vyaparsetu.repository.expense;

import com.vyaparsetu.entity.expense.Expense;
import com.vyaparsetu.entity.expense.Expense.ExpenseCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID>, JpaSpecificationExecutor<Expense> {

    Page<Expense> findByBusinessId(UUID businessId, Pageable pageable);

    Page<Expense> findByBusinessIdAndExpenseDateBetween(UUID businessId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<Expense> findByBusinessIdAndCategory(UUID businessId, ExpenseCategory category, Pageable pageable);
}
