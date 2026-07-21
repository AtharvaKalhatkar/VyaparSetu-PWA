package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.dto.invoice.InvoiceCreateRequest;
import com.vyaparsetu.dto.invoice.InvoiceDto;
import com.vyaparsetu.entity.invoice.InvoiceSequence;
import com.vyaparsetu.service.invoice.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
@RequestMapping("/api/v1/businesses/{businessId}/invoices")
@RequiredArgsConstructor
@Slf4j
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<InvoiceDto>>> getInvoices(
            @PathVariable UUID businessId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<InvoiceDto> invoices = invoiceService.getInvoicesByBusiness(businessId, status, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @GetMapping("/{invoiceId}")
    public ResponseEntity<ApiResponse<InvoiceDto>> getInvoiceById(@PathVariable UUID businessId,
                                                                   @PathVariable UUID invoiceId) {
        InvoiceDto invoice = invoiceService.getInvoiceById(businessId, invoiceId);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceDto>> createInvoice(@PathVariable UUID businessId,
                                                                  @Valid @RequestBody InvoiceCreateRequest request) {
        InvoiceDto invoice = invoiceService.createInvoice(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Invoice created", invoice));
    }

    @PutMapping("/{invoiceId}")
    public ResponseEntity<ApiResponse<InvoiceDto>> updateInvoice(@PathVariable UUID businessId,
                                                                  @PathVariable UUID invoiceId,
                                                                  @Valid @RequestBody InvoiceCreateRequest request) {
        InvoiceDto invoice = invoiceService.updateInvoice(businessId, invoiceId, request);
        return ResponseEntity.ok(ApiResponse.success("Invoice updated", invoice));
    }

    @DeleteMapping("/{invoiceId}")
    public ResponseEntity<ApiResponse<Void>> deleteInvoice(@PathVariable UUID businessId,
                                                           @PathVariable UUID invoiceId) {
        invoiceService.deleteInvoice(businessId, invoiceId);
        return ResponseEntity.ok(ApiResponse.success("Invoice deleted", null));
    }

    @GetMapping("/number/{invoiceNo}")
    public ResponseEntity<ApiResponse<InvoiceDto>> getInvoiceByNumber(@PathVariable UUID businessId,
                                                                       @PathVariable String invoiceNo) {
        InvoiceDto invoice = invoiceService.getInvoiceByNumber(businessId, invoiceNo);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @PostMapping("/{invoiceId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelInvoice(@PathVariable UUID businessId,
                                                           @PathVariable UUID invoiceId) {
        invoiceService.cancelInvoice(businessId, invoiceId);
        return ResponseEntity.ok(ApiResponse.success("Invoice cancelled", null));
    }

    @GetMapping("/{invoiceId}/pdf")
    public ResponseEntity<byte[]> generateInvoicePdf(@PathVariable UUID businessId,
                                                      @PathVariable UUID invoiceId) {
        byte[] pdf = invoiceService.generateInvoicePdf(businessId, invoiceId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PostMapping("/{invoiceId}/irn")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateIrn(@PathVariable UUID businessId,
                                                                         @PathVariable UUID invoiceId) {
        Map<String, Object> irn = invoiceService.generateIrn(businessId, invoiceId);
        return ResponseEntity.ok(ApiResponse.success("IRN generated", irn));
    }

    @GetMapping("/next-number")
    public ResponseEntity<ApiResponse<String>> getNextInvoiceNumber(
            @PathVariable UUID businessId,
            @RequestParam(required = false) String invoiceType) {
        String nextNumber = invoiceService.getNextInvoiceNumber(businessId, invoiceType);
        return ResponseEntity.ok(ApiResponse.success(nextNumber));
    }

    @PostMapping("/sequences")
    public ResponseEntity<ApiResponse<InvoiceSequence>> createInvoiceSequence(
            @PathVariable UUID businessId,
            @Valid @RequestBody InvoiceSequence sequence) {
        InvoiceSequence created = invoiceService.createInvoiceSequence(businessId, sequence);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Sequence created", created));
    }
}
