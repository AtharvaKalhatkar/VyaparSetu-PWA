package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.dto.report.GstReportDto;
import com.vyaparsetu.dto.report.OutstandingReportDto;
import com.vyaparsetu.dto.report.ProfitLossDto;
import com.vyaparsetu.dto.report.PurchaseReportDto;
import com.vyaparsetu.dto.report.ReportRequest;
import com.vyaparsetu.dto.report.SalesReportDto;
import com.vyaparsetu.dto.report.StockReportDto;
import com.vyaparsetu.service.report.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/sales")
    public ResponseEntity<ApiResponse<SalesReportDto>> generateSalesReport(
            @PathVariable UUID businessId,
            @Valid @RequestBody ReportRequest request) {
        SalesReportDto report = reportService.generateSalesReport(businessId, request);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping("/purchases")
    public ResponseEntity<ApiResponse<PurchaseReportDto>> generatePurchaseReport(
            @PathVariable UUID businessId,
            @Valid @RequestBody ReportRequest request) {
        PurchaseReportDto report = reportService.generatePurchaseReport(businessId, request);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/outstanding")
    public ResponseEntity<ApiResponse<OutstandingReportDto>> generateOutstandingReport(
            @PathVariable UUID businessId) {
        OutstandingReportDto report = reportService.generateOutstandingReport(businessId);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/stock")
    public ResponseEntity<ApiResponse<StockReportDto>> generateStockReport(
            @PathVariable UUID businessId) {
        StockReportDto report = reportService.generateStockReport(businessId);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping("/gst")
    public ResponseEntity<ApiResponse<GstReportDto>> generateGstReport(
            @PathVariable UUID businessId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        GstReportDto report = reportService.generateGstReport(businessId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping("/profit-loss")
    public ResponseEntity<ApiResponse<ProfitLossDto>> generateProfitLoss(
            @PathVariable UUID businessId,
            @Valid @RequestBody ReportRequest request) {
        ProfitLossDto report = reportService.generateProfitLoss(businessId, request);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping("/balance-sheet")
    public ResponseEntity<ApiResponse<ProfitLossDto>> generateBalanceSheet(
            @PathVariable UUID businessId,
            @Valid @RequestBody ReportRequest request) {
        ProfitLossDto report = reportService.generateProfitLoss(businessId, request);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping("/trial-balance")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateTrialBalance(
            @PathVariable UUID businessId,
            @Valid @RequestBody ReportRequest request) {
        Map<String, Object> report = new java.util.HashMap<>();
        report.put("status", "Trial balance generation not yet implemented");
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> exportReport(
            @PathVariable UUID businessId,
            @RequestParam String reportType,
            @RequestParam(defaultValue = "PDF") String format,
            @Valid @RequestBody ReportRequest request) {
        byte[] data;
        String contentType;
        String filename;

        if ("EXCEL".equalsIgnoreCase(format)) {
            data = reportService.exportReportToExcel(businessId, reportType, request);
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            filename = reportType + "_report.xlsx";
        } else {
            data = reportService.exportReportToPdf(businessId, reportType, request);
            contentType = "application/pdf";
            filename = reportType + "_report.pdf";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .body(data);
    }
}
