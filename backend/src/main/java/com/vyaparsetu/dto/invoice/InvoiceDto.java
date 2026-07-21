package com.vyaparsetu.dto.invoice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDto {
    private UUID id;
    private String invoiceNo;
    private String invoiceType;
    private UUID partyId;
    private String partyName;
    private String partyPhone;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private String reference;
    private String status;
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
    private BigDecimal balanceDue;
    private String paymentStatus;
    private String paymentMode;
    private String termsAndConditions;
    private String notes;
    private String irn;
    private String ewayBillNo;
    private String qrCodeUrl;
    private String pdfUrl;
    private boolean isGstInvoice;
    private String placeOfSupply;
    private boolean reverseCharge;
    private List<InvoiceItemDto> items;
    private Instant createdAt;
    private Instant updatedAt;
}
