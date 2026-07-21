package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.dto.gst.GstReturnDto;
import com.vyaparsetu.dto.gst.HsnSummaryDto;
import com.vyaparsetu.entity.invoice.Invoice;
import com.vyaparsetu.service.gst.GstService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/gst")
@RequiredArgsConstructor
@Slf4j
public class GstController {

    private final GstService gstService;

    @PostMapping("/validate-gstin")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateGstin(@RequestParam String gstin) {
        boolean valid = gstService.validateGstin(gstin);
        Map<String, Object> result = Map.of("gstin", gstin, "valid", valid);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> calculateGst(
            @RequestParam BigDecimal amount,
            @RequestParam BigDecimal gstRate,
            @RequestParam(required = false) String placeOfSupply,
            @RequestParam(required = false) String businessState) {
        Map<String, BigDecimal> result = gstService.calculateGst(amount, gstRate, placeOfSupply, businessState);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/generate-irn")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateIrn(@PathVariable UUID businessId,
                                                                         @RequestParam UUID invoiceId) {
        Invoice invoice = new Invoice();
        invoice.setId(invoiceId);
        Map<String, Object> irn = gstService.generateIrn(invoice);
        return ResponseEntity.ok(ApiResponse.success("IRN generated", irn));
    }

    @GetMapping("/gstr1")
    public ResponseEntity<ApiResponse<GstReturnDto>> generateGstr1(
            @PathVariable UUID businessId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        GstReturnDto gstr1 = gstService.generateGstr1(businessId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(gstr1));
    }

    @GetMapping("/gstr3b")
    public ResponseEntity<ApiResponse<GstReturnDto>> generateGstr3b(
            @PathVariable UUID businessId,
            @RequestParam Integer month,
            @RequestParam Integer year) {
        GstReturnDto gstr3b = gstService.generateGstr3b(businessId, month, year);
        return ResponseEntity.ok(ApiResponse.success(gstr3b));
    }

    @GetMapping("/hsn-summary")
    public ResponseEntity<ApiResponse<List<HsnSummaryDto>>> getHsnSummary(
            @PathVariable UUID businessId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<HsnSummaryDto> summary = gstService.getHsnSummary(businessId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
