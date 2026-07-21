package com.vyaparsetu.entity.invoice;

import com.vyaparsetu.common.TenantEntity;
import com.vyaparsetu.entity.party.Party;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLRestriction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "invoices", indexes = {
    @Index(name = "idx_invoice_business_no", columnList = "businessId, invoiceNo"),
    @Index(name = "idx_invoice_business_party", columnList = "businessId, partyId"),
    @Index(name = "idx_invoice_business_date", columnList = "businessId, invoiceDate"),
    @Index(name = "idx_invoice_business_status", columnList = "businessId, status")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Invoice extends TenantEntity {

    @Column(name = "invoice_no", nullable = false, length = 50)
    private String invoiceNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", nullable = false, length = 30)
    private InvoiceType invoiceType;

    @Column(name = "party_id", nullable = false, columnDefinition = "UUID")
    private UUID partyId;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(length = 100)
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvoiceStatus status;

    @Column(precision = 15, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_percent", precision = 5, scale = 2)
    private BigDecimal discountPercent;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "taxable_amount", precision = 15, scale = 2)
    private BigDecimal taxableAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal cgst;

    @Column(precision = 15, scale = 2)
    private BigDecimal sgst;

    @Column(precision = 15, scale = 2)
    private BigDecimal igst;

    @Column(precision = 15, scale = 2)
    private BigDecimal cess;

    @Column(name = "total_gst", precision = 15, scale = 2)
    private BigDecimal totalGst;

    @Column(name = "round_off", precision = 15, scale = 2)
    private BigDecimal roundOff;

    @Column(name = "grand_total", precision = 15, scale = 2)
    private BigDecimal grandTotal;

    @Column(name = "paid_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "balance_due", precision = 15, scale = 2)
    private BigDecimal balanceDue;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", length = 20)
    private PaymentMode paymentMode;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 200)
    private String irn;

    @Column(name = "irn_generated_at")
    private Instant irnGeneratedAt;

    @Column(name = "eway_bill_no", length = 50)
    private String ewayBillNo;

    @Column(name = "qr_code_url")
    private String qrCodeUrl;

    @Column(name = "pdf_url")
    private String pdfUrl;

    @Column(name = "is_gst_invoice", nullable = false)
    @Builder.Default
    private boolean isGstInvoice = false;

    @Column(name = "place_of_supply", length = 100)
    private String placeOfSupply;

    @Column(name = "reverse_charge", nullable = false)
    @Builder.Default
    private boolean reverseCharge = false;

    @Column(name = "tally_voucher_id", length = 50)
    private String tallyVoucherId;

    @Column(name = "tally_guid", length = 50)
    private String tallyGuid;

    @Column(name = "invoice_sequence_id", columnDefinition = "UUID")
    private UUID invoiceSequenceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "party_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Party party;

    public enum InvoiceType {
        TAX_INVOICE, RETAIL_INVOICE, QUOTATION, SALES_ORDER, DELIVERY_CHALLAN,
        PURCHASE_BILL, PURCHASE_ORDER, SALES_RETURN, PURCHASE_RETURN,
        CREDIT_NOTE, DEBIT_NOTE, PROFORMA
    }

    public enum InvoiceStatus {
        DRAFT, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, RETURNED
    }

    public enum PaymentStatus {
        PAID, PARTIAL, UNPAID, CANCELLED
    }

    public enum PaymentMode {
        CASH, BANK, UPI, CARD, CHEQUE, CREDIT, ONLINE
    }
}
