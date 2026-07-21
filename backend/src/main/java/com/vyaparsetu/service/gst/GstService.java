package com.vyaparsetu.service.gst;

import com.vyaparsetu.common.BadRequestException;
import com.vyaparsetu.dto.gst.GstReturnDto;
import com.vyaparsetu.dto.gst.HsnSummaryDto;
import com.vyaparsetu.entity.invoice.Invoice;
import com.vyaparsetu.entity.invoice.Invoice.InvoiceType;
import com.vyaparsetu.entity.invoice.InvoiceItem;
import com.vyaparsetu.repository.invoice.InvoiceItemRepository;
import com.vyaparsetu.repository.invoice.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class GstService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;

    private static final Pattern GSTIN_PATTERN =
            Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$");

    public boolean validateGstin(String gstin) {
        if (gstin == null || gstin.isBlank()) return false;
        boolean formatValid = GSTIN_PATTERN.matcher(gstin.toUpperCase()).matches();
        log.info("GSTIN validation for {}: format valid={}", gstin, formatValid);
        return formatValid;
    }

    public Map<String, BigDecimal> calculateGst(BigDecimal amount, BigDecimal gstRate,
                                                  String placeOfSupply, String businessState) {
        Map<String, BigDecimal> result = new HashMap<>();

        if (gstRate == null || gstRate.compareTo(BigDecimal.ZERO) == 0) {
            result.put("cgst", BigDecimal.ZERO);
            result.put("sgst", BigDecimal.ZERO);
            result.put("igst", BigDecimal.ZERO);
            result.put("totalGst", BigDecimal.ZERO);
            return result;
        }

        boolean isInterState = placeOfSupply != null && businessState != null
                && !placeOfSupply.equalsIgnoreCase(businessState);

        BigDecimal gstAmount = amount.multiply(gstRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        if (isInterState) {
            result.put("cgst", BigDecimal.ZERO);
            result.put("sgst", BigDecimal.ZERO);
            result.put("igst", gstAmount);
        } else {
            BigDecimal halfGst = gstAmount.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
            result.put("cgst", halfGst);
            result.put("sgst", halfGst);
            result.put("igst", BigDecimal.ZERO);
        }

        result.put("totalGst", gstAmount);
        return result;
    }

    public Map<String, Object> generateIrn(Invoice invoice) {
        log.info("Generating mock IRN for invoice: {}", invoice.getInvoiceNo());

        Map<String, Object> irnData = new HashMap<>();
        irnData.put("irn", "MOCK-IRN-" + System.currentTimeMillis());
        irnData.put("ackNo", "MOCK-ACK-" + System.currentTimeMillis());
        irnData.put("ackDate", LocalDate.now().toString());
        irnData.put("status", "GENERATED");
        return irnData;
    }

    public GstReturnDto generateGstr1(UUID businessId, LocalDate startDate, LocalDate endDate) {
        log.info("Generating GSTR-1 for business: {} from {} to {}", businessId, startDate, endDate);

        List<Invoice> invoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, startDate, endDate)
                .stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.TAX_INVOICE
                        || inv.getInvoiceType() == InvoiceType.RETAIL_INVOICE)
                .toList();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalInvoices", invoices.size());
        summary.put("totalTaxableValue", invoices.stream()
                .map(inv -> inv.getTaxableAmount() != null ? inv.getTaxableAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        summary.put("totalCgst", invoices.stream()
                .map(inv -> inv.getCgst() != null ? inv.getCgst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        summary.put("totalSgst", invoices.stream()
                .map(inv -> inv.getSgst() != null ? inv.getSgst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        summary.put("totalIgst", invoices.stream()
                .map(inv -> inv.getIgst() != null ? inv.getIgst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        summary.put("totalGst", invoices.stream()
                .map(inv -> inv.getTotalGst() != null ? inv.getTotalGst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        return GstReturnDto.builder()
                .period(startDate + " to " + endDate)
                .gstrType("GSTR-1")
                .summary(summary)
                .build();
    }

    public GstReturnDto generateGstr3b(UUID businessId, Integer month, Integer year) {
        log.info("Generating GSTR-3B for business: {} month: {} year: {}", businessId, month, year);

        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        List<Invoice> salesInvoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, start, end)
                .stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.TAX_INVOICE
                        || inv.getInvoiceType() == InvoiceType.RETAIL_INVOICE)
                .toList();

        List<Invoice> purchaseInvoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, start, end)
                .stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.PURCHASE_BILL)
                .toList();

        Map<String, Object> summary = new HashMap<>();
        summary.put("period", String.format("%02d-%d", month, year));

        Map<String, Object> outwardSupplies = new HashMap<>();
        outwardSupplies.put("taxableValue", salesInvoices.stream()
                .map(inv -> inv.getTaxableAmount() != null ? inv.getTaxableAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        outwardSupplies.put("totalTax", salesInvoices.stream()
                .map(inv -> inv.getTotalGst() != null ? inv.getTotalGst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        summary.put("outwardSupplies", outwardSupplies);

        Map<String, Object> inwardSupplies = new HashMap<>();
        inwardSupplies.put("taxableValue", purchaseInvoices.stream()
                .map(inv -> inv.getTaxableAmount() != null ? inv.getTaxableAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        inwardSupplies.put("itcClaimed", purchaseInvoices.stream()
                .map(inv -> inv.getTotalGst() != null ? inv.getTotalGst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        summary.put("inwardSupplies", inwardSupplies);

        return GstReturnDto.builder()
                .period(start + " to " + end)
                .gstrType("GSTR-3B")
                .summary(summary)
                .build();
    }

    public List<HsnSummaryDto> getHsnSummary(UUID businessId, LocalDate startDate, LocalDate endDate) {
        log.info("Generating HSN summary for business: {}", businessId);

        List<Invoice> invoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, startDate, endDate);
        Map<String, HsnSummaryAggregator> hsnMap = new HashMap<>();

        for (Invoice inv : invoices) {
            List<InvoiceItem> items = invoiceItemRepository.findByBusinessIdAndInvoiceId(businessId, inv.getId());
            for (InvoiceItem item : items) {
                String hsn = item.getHsnCode() != null ? item.getHsnCode() : "OTHER";
                HsnSummaryAggregator agg = hsnMap.computeIfAbsent(hsn, k -> new HsnSummaryAggregator());
                agg.quantity = agg.quantity.add(item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO);
                agg.taxableValue = agg.taxableValue.add(item.getTaxableAmount() != null ? item.getTaxableAmount() : BigDecimal.ZERO);
                BigDecimal itemGst = (item.getCgst() != null ? item.getCgst() : BigDecimal.ZERO)
                        .add(item.getSgst() != null ? item.getSgst() : BigDecimal.ZERO)
                        .add(item.getIgst() != null ? item.getIgst() : BigDecimal.ZERO);
                agg.totalGst = agg.totalGst.add(itemGst);
                agg.rate = item.getGstRate() != null ? item.getGstRate() : BigDecimal.ZERO;
                agg.unit = item.getUnit() != null ? item.getUnit() : "NOS";
            }
        }

        return hsnMap.entrySet().stream()
                .map(entry -> HsnSummaryDto.builder()
                        .hsnCode(entry.getKey())
                        .description(getHsnDescription(entry.getKey()))
                        .totalQuantity(entry.getValue().quantity)
                        .unit(entry.getValue().unit)
                        .taxableValue(entry.getValue().taxableValue)
                        .totalGst(entry.getValue().totalGst)
                        .rate(entry.getValue().rate)
                        .build())
                .toList();
    }

    private String getHsnDescription(String hsnCode) {
        if (hsnCode == null || hsnCode.equals("OTHER")) return "Other Items";
        return "HSN " + hsnCode;
    }

    private static class HsnSummaryAggregator {
        BigDecimal quantity = BigDecimal.ZERO;
        BigDecimal taxableValue = BigDecimal.ZERO;
        BigDecimal totalGst = BigDecimal.ZERO;
        BigDecimal rate = BigDecimal.ZERO;
        String unit = "NOS";
    }
}
