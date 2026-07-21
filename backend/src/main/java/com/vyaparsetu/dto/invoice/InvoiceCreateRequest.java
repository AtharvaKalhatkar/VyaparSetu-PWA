package com.vyaparsetu.dto.invoice;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceCreateRequest {
    private String invoiceType;
    @NotNull
    private UUID partyId;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private String reference;
    private BigDecimal subtotal;
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal taxableAmount;
    private BigDecimal cgst;
    private BigDecimal sgst;
    private BigDecimal igst;
    private BigDecimal cess;
    private BigDecimal totalGst;
    private BigDecimal roundOff;
    private BigDecimal grandTotal;
    private BigDecimal paidAmount;
    private String paymentStatus;
    private String paymentMode;
    private String termsAndConditions;
    private String notes;
    private boolean isGstInvoice;
    private String placeOfSupply;
    private boolean reverseCharge;
    @NotEmpty
    private List<InvoiceItemRequest> items;
}
