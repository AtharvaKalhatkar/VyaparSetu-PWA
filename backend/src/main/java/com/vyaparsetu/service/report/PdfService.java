package com.vyaparsetu.service.report;

import com.vyaparsetu.entity.business.Business;
import com.vyaparsetu.entity.invoice.Invoice;
import com.vyaparsetu.entity.invoice.InvoiceItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class PdfService {

    public byte[] generateInvoicePdf(Invoice invoice, List<InvoiceItem> items, Business business) {
        log.info("Generating invoice PDF for invoice: {}", invoice.getInvoiceNo());
        try {
            return buildInvoicePdf(invoice, items, business);
        } catch (Exception e) {
            log.error("Failed to generate invoice PDF: {}", e.getMessage());
            return new byte[0];
        }
    }

    public byte[] generateReportPdf(String reportType, Object data, Business business) {
        log.info("Generating report PDF for type: {}", reportType);
        return new byte[0];
    }

    private byte[] buildInvoicePdf(Invoice invoice, List<InvoiceItem> items, Business business) {
        StringBuilder sb = new StringBuilder();
        sb.append("INVOICE\n");
        sb.append("=======\n\n");
        if (business != null) {
            sb.append("Business: ").append(business.getName()).append("\n");
            sb.append("GSTIN: ").append(business.getGstin() != null ? business.getGstin() : "N/A").append("\n");
            sb.append("Address: ").append(business.getAddressLine1()).append("\n\n");
        }
        sb.append("Invoice No: ").append(invoice.getInvoiceNo()).append("\n");
        sb.append("Date: ").append(invoice.getInvoiceDate()).append("\n");
        sb.append("Due Date: ").append(invoice.getDueDate()).append("\n\n");

        sb.append("Items:\n");
        sb.append(String.format("%-5s %-30s %10s %10s %10s\n", "#", "Item", "Qty", "Rate", "Amount"));
        sb.append("-".repeat(75)).append("\n");

        for (InvoiceItem item : items) {
            sb.append(String.format("%-5d %-30s %10.2f %10.2f %10.2f\n",
                    item.getSerialNo() != null ? item.getSerialNo() : 0,
                    item.getDescription() != null ? item.getDescription() : "",
                    item.getQuantity() != null ? item.getQuantity() : java.math.BigDecimal.ZERO,
                    item.getRate() != null ? item.getRate() : java.math.BigDecimal.ZERO,
                    item.getTotalAmount() != null ? item.getTotalAmount() : java.math.BigDecimal.ZERO));
        }

        sb.append("-".repeat(75)).append("\n");
        sb.append(String.format("%-55s %10.2f\n", "Subtotal:", invoice.getSubtotal() != null ? invoice.getSubtotal() : java.math.BigDecimal.ZERO));
        sb.append(String.format("%-55s %10.2f\n", "CGST:", invoice.getCgst() != null ? invoice.getCgst() : java.math.BigDecimal.ZERO));
        sb.append(String.format("%-55s %10.2f\n", "SGST:", invoice.getSgst() != null ? invoice.getSgst() : java.math.BigDecimal.ZERO));
        sb.append(String.format("%-55s %10.2f\n", "IGST:", invoice.getIgst() != null ? invoice.getIgst() : java.math.BigDecimal.ZERO));
        sb.append(String.format("%-55s %10.2f\n", "Grand Total:", invoice.getGrandTotal() != null ? invoice.getGrandTotal() : java.math.BigDecimal.ZERO));
        sb.append("\nAmount in words: ").append("(mock)").append("\n");
        sb.append("\nQR Code Placeholder\n");
        sb.append("\nAuthorized Signature\n");

        return sb.toString().getBytes();
    }
}
