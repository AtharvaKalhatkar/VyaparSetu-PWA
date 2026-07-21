package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.dto.dashboard.CashFlowDto;
import com.vyaparsetu.dto.dashboard.DashboardDto;
import com.vyaparsetu.service.dashboard.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardDto>> getDashboard(@PathVariable UUID businessId) {
        DashboardDto dashboard = dashboardService.getDashboard(businessId);
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }

    @GetMapping("/sales")
    public ResponseEntity<ApiResponse<BigDecimal>> getTodaySales(@PathVariable UUID businessId) {
        BigDecimal sales = dashboardService.getTodaySales(businessId);
        return ResponseEntity.ok(ApiResponse.success(sales));
    }

    @GetMapping("/cashflow")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getCashFlow(
            @PathVariable UUID businessId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Map<String, BigDecimal> cashflow = dashboardService.getCashFlow(businessId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(cashflow));
    }
}
