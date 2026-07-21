package com.vyaparsetu.service.expense;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.expense.ExpenseCreateRequest;
import com.vyaparsetu.dto.expense.ExpenseDto;
import com.vyaparsetu.dto.mapper.ExpenseMapper;
import com.vyaparsetu.entity.expense.Expense;
import com.vyaparsetu.entity.expense.Expense.ExpenseCategory;
import com.vyaparsetu.repository.expense.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseMapper expenseMapper;
    private final AuditService auditService;

    @Transactional
    public ExpenseDto createExpense(UUID businessId, ExpenseCreateRequest request) {
        log.info("Creating expense in business: {}", businessId);

        Expense expense = Expense.builder()
                .businessId(businessId)
                .expenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now())
                .category(request.getCategory() != null ? ExpenseCategory.valueOf(request.getCategory().toUpperCase()) : ExpenseCategory.MISCELLANEOUS)
                .amount(request.getAmount())
                .paymentMode(request.getPaymentMode() != null ? Expense.PaymentMode.valueOf(request.getPaymentMode().toUpperCase()) : null)
                .paidTo(request.getPaidTo())
                .description(request.getDescription())
                .reference(request.getReference())
                .isBillable(request.isBillable())
                .build();

        String expenseNo = "EXP-" + System.currentTimeMillis();
        expense.setExpenseNo(expenseNo);
        expense = expenseRepository.save(expense);

        auditService.logEvent(businessId.toString(), "CREATE_EXPENSE", "Expense", expense.getId(),
                null, Map.of("amount", request.getAmount().toString(), "category", request.getCategory()));

        return expenseMapper.toDto(expense);
    }

    @Transactional
    public ExpenseDto updateExpense(UUID businessId, UUID expenseId, ExpenseCreateRequest request) {
        log.info("Updating expense: {} in business: {}", expenseId, businessId);

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", expenseId));

        if (request.getExpenseDate() != null) expense.setExpenseDate(request.getExpenseDate());
        if (request.getCategory() != null) expense.setCategory(ExpenseCategory.valueOf(request.getCategory().toUpperCase()));
        if (request.getAmount() != null) expense.setAmount(request.getAmount());
        if (request.getPaymentMode() != null) expense.setPaymentMode(Expense.PaymentMode.valueOf(request.getPaymentMode().toUpperCase()));
        if (request.getPaidTo() != null) expense.setPaidTo(request.getPaidTo());
        if (request.getDescription() != null) expense.setDescription(request.getDescription());
        if (request.getReference() != null) expense.setReference(request.getReference());
        expense.setBillable(request.isBillable());

        expense = expenseRepository.save(expense);

        auditService.logEvent(businessId.toString(), "UPDATE_EXPENSE", "Expense", expenseId,
                null, Map.of("amount", expense.getAmount().toString()));

        return expenseMapper.toDto(expense);
    }

    @Transactional
    public void deleteExpense(UUID businessId, UUID expenseId) {
        log.info("Deleting expense: {} in business: {}", expenseId, businessId);

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", expenseId));
        expense.setDeleted(true);
        expenseRepository.save(expense);

        auditService.logEvent(businessId.toString(), "DELETE_EXPENSE", "Expense", expenseId, null, null);
    }

    @Transactional(readOnly = true)
    public ExpenseDto getExpenseById(UUID businessId, UUID expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", expenseId));
        return expenseMapper.toDto(expense);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ExpenseDto> getExpensesByBusiness(UUID businessId, Pageable pageable) {
        Page<Expense> expensePage = expenseRepository.findByBusinessId(businessId, pageable);
        List<ExpenseDto> dtos = expenseMapper.toDtoList(expensePage.getContent());
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                expensePage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PagedResponse<ExpenseDto> getExpensesByCategory(UUID businessId, LocalDate startDate,
                                                            LocalDate endDate, Pageable pageable) {
        Page<Expense> expensePage = expenseRepository
                .findByBusinessIdAndExpenseDateBetween(businessId, startDate, endDate, pageable);
        List<ExpenseDto> dtos = expenseMapper.toDtoList(expensePage.getContent());
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                expensePage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getExpenseSummary(UUID businessId, LocalDate startDate, LocalDate endDate) {
        List<Expense> expenses = expenseRepository
                .findByBusinessIdAndExpenseDateBetween(businessId, startDate, endDate, Pageable.unpaged())
                .getContent();

        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> categoryBreakdown = new HashMap<>();
        for (Expense expense : expenses) {
            String cat = expense.getCategory() != null ? expense.getCategory().name() : "OTHER";
            categoryBreakdown.merge(cat, expense.getAmount(), BigDecimal::add);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalExpenses", totalExpenses);
        summary.put("period", startDate + " to " + endDate);
        summary.put("count", expenses.size());
        summary.put("categoryBreakdown", categoryBreakdown);
        return summary;
    }
}
