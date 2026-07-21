package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.dto.expense.ExpenseCreateRequest;
import com.vyaparsetu.dto.expense.ExpenseDto;
import com.vyaparsetu.service.expense.ExpenseService;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/expenses")
@RequiredArgsConstructor
@Slf4j
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ExpenseDto>>> getExpenses(
            @PathVariable UUID businessId,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<ExpenseDto> expenses = expenseService.getExpensesByBusiness(businessId, pageable);
        return ResponseEntity.ok(ApiResponse.success(expenses));
    }

    @GetMapping("/{expenseId}")
    public ResponseEntity<ApiResponse<ExpenseDto>> getExpenseById(@PathVariable UUID businessId,
                                                                   @PathVariable UUID expenseId) {
        ExpenseDto expense = expenseService.getExpenseById(businessId, expenseId);
        return ResponseEntity.ok(ApiResponse.success(expense));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseDto>> createExpense(@PathVariable UUID businessId,
                                                                  @Valid @RequestBody ExpenseCreateRequest request) {
        ExpenseDto expense = expenseService.createExpense(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Expense created", expense));
    }

    @PutMapping("/{expenseId}")
    public ResponseEntity<ApiResponse<ExpenseDto>> updateExpense(@PathVariable UUID businessId,
                                                                  @PathVariable UUID expenseId,
                                                                  @Valid @RequestBody ExpenseCreateRequest request) {
        ExpenseDto expense = expenseService.updateExpense(businessId, expenseId, request);
        return ResponseEntity.ok(ApiResponse.success("Expense updated", expense));
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(@PathVariable UUID businessId,
                                                           @PathVariable UUID expenseId) {
        expenseService.deleteExpense(businessId, expenseId);
        return ResponseEntity.ok(ApiResponse.success("Expense deleted", null));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExpenseSummary(
            @PathVariable UUID businessId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Map<String, Object> summary = expenseService.getExpenseSummary(businessId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
