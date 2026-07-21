package com.vyaparsetu.dto.gst;

import com.vyaparsetu.dto.invoice.InvoiceItemDto;
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
public class GstInvoiceDto {
    private UUID id;
    private String invoiceNo;
    private String invoiceType;
    private UUID partyId;
    private String partyName;
    private String partyGstin;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private String status;
    private BigDecimal taxableAmount;
    private BigDecimal cgst;
    private BigDecimal sgst;
    private BigDecimal igst;
    private BigDecimal cess;
    private BigDecimal totalGst;
    private BigDecimal grandTotal;
    private String irn;
    private String ewayBillNo;
    private String qrCodeUrl;
    private String placeOfSupply;
    private boolean reverseCharge;
    private List<InvoiceItemDto> items;
    private Instant createdAt;
}
