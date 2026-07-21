package com.vyaparsetu.service.report;

import com.vyaparsetu.dto.item.StockAlertDto;
import com.vyaparsetu.dto.ledger.OutstandingDto;
import com.vyaparsetu.dto.report.GstReportDto;
import com.vyaparsetu.dto.report.OutstandingReportDto;
import com.vyaparsetu.dto.report.ProfitLossDto;
import com.vyaparsetu.dto.report.PurchaseReportDto;
import com.vyaparsetu.dto.report.ReportRequest;
import com.vyaparsetu.dto.report.SalesReportDto;
import com.vyaparsetu.dto.report.StockReportDto;
import com.vyaparsetu.entity.expense.Expense;
import com.vyaparsetu.entity.invoice.Invoice;
import com.vyaparsetu.entity.invoice.Invoice.InvoiceType;
import com.vyaparsetu.entity.invoice.InvoiceItem;
import com.vyaparsetu.entity.item.Item;
import com.vyaparsetu.entity.ledger.LedgerEntry;
import com.vyaparsetu.entity.party.Party;
import com.vyaparsetu.repository.expense.ExpenseRepository;
import com.vyaparsetu.repository.inventory.InventoryRepository;
import com.vyaparsetu.repository.invoice.InvoiceItemRepository;
import com.vyaparsetu.repository.invoice.InvoiceRepository;
import com.vyaparsetu.repository.item.ItemRepository;
import com.vyaparsetu.repository.ledger.LedgerEntryRepository;
import com.vyaparsetu.repository.party.PartyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final PartyRepository partyRepository;
    private final ItemRepository itemRepository;
    private final InventoryRepository inventoryRepository;
    private final ExpenseRepository expenseRepository;

    @Transactional(readOnly = true)
    public SalesReportDto generateSalesReport(UUID businessId, ReportRequest request) {
        log.info("Generating sales report for business: {}", businessId);

        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();

        List<Invoice> invoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, startDate, endDate)
                .stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.TAX_INVOICE
                        || inv.getInvoiceType() == InvoiceType.RETAIL_INVOICE
                        || inv.getInvoiceType() == InvoiceType.SALES_ORDER)
                .toList();

        long totalInvoices = invoices.size();
        BigDecimal totalSales = invoices.stream()
                .map(inv -> inv.getGrandTotal() != null ? inv.getGrandTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTax = invoices.stream()
                .map(inv -> inv.getTotalGst() != null ? inv.getTotalGst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal discountGiven = invoices.stream()
                .map(inv -> inv.getDiscountAmount() != null ? inv.getDiscountAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal avgInvoiceValue = totalInvoices > 0 ? totalSales.divide(BigDecimal.valueOf(totalInvoices), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;

        Map<String, BigDecimal> paymentModeBreakdown = new HashMap<>();
        for (Invoice inv : invoices) {
            String mode = inv.getPaymentMode() != null ? inv.getPaymentMode().name() : "OTHER";
            paymentModeBreakdown.merge(mode, inv.getPaidAmount() != null ? inv.getPaidAmount() : BigDecimal.ZERO, BigDecimal::add);
        }

        List<Map<String, Object>> dailyBreakdown = new ArrayList<>();
        Map<LocalDate, List<Invoice>> byDate = invoices.stream().collect(Collectors.groupingBy(Invoice::getInvoiceDate));
        for (Map.Entry<LocalDate, List<Invoice>> entry : byDate.entrySet()) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", entry.getKey().toString());
            dayData.put("count", entry.getValue().size());
            dayData.put("total", entry.getValue().stream()
                    .map(inv -> inv.getGrandTotal() != null ? inv.getGrandTotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            dailyBreakdown.add(dayData);
        }
        dailyBreakdown.sort(Comparator.comparing(m -> m.get("date").toString()));

        return SalesReportDto.builder()
                .period(startDate + " to " + endDate)
                .totalInvoices(totalInvoices)
                .totalSales(totalSales)
                .totalTax(totalTax)
                .discountGiven(discountGiven)
                .averageInvoiceValue(avgInvoiceValue)
                .paymentModeBreakdown(paymentModeBreakdown)
                .dailyBreakdown(dailyBreakdown)
                .build();
    }

    @Transactional(readOnly = true)
    public PurchaseReportDto generatePurchaseReport(UUID businessId, ReportRequest request) {
        log.info("Generating purchase report for business: {}", businessId);

        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();

        List<Invoice> purchaseInvoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, startDate, endDate)
                .stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.PURCHASE_BILL)
                .toList();

        BigDecimal totalPurchases = purchaseInvoices.stream()
                .map(inv -> inv.getGrandTotal() != null ? inv.getGrandTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTax = purchaseInvoices.stream()
                .map(inv -> inv.getTotalGst() != null ? inv.getTotalGst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<UUID, BigDecimal> supplierTotals = new HashMap<>();
        for (Invoice inv : purchaseInvoices) {
            supplierTotals.merge(inv.getPartyId(), inv.getGrandTotal() != null ? inv.getGrandTotal() : BigDecimal.ZERO, BigDecimal::add);
        }

        List<Map<String, Object>> topSuppliers = supplierTotals.entrySet().stream()
                .sorted(Map.Entry.<UUID, BigDecimal>comparingByValue().reversed())
                .limit(10)
                .map(entry -> {
                    Party party = partyRepository.findById(entry.getKey()).orElse(null);
                    Map<String, Object> s = new HashMap<>();
                    s.put("partyId", entry.getKey());
                    s.put("name", party != null ? party.getName() : "Unknown");
                    s.put("total", entry.getValue());
                    return s;
                })
                .toList();

        return PurchaseReportDto.builder()
                .period(startDate + " to " + endDate)
                .totalPurchases(totalPurchases)
                .totalTax(totalTax)
                .topSuppliers(topSuppliers)
                .build();
    }

    @Transactional(readOnly = true)
    public OutstandingReportDto generateOutstandingReport(UUID businessId) {
        log.info("Generating outstanding report for business: {}", businessId);

        List<Object[]> outstandingData = ledgerEntryRepository.getOutstandingByBusinessId(businessId);
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        List<OutstandingDto> partyWise = new ArrayList<>();

        Map<String, BigDecimal> agingSummary = new LinkedHashMap<>();
        agingSummary.put("0-30 days", BigDecimal.ZERO);
        agingSummary.put("31-60 days", BigDecimal.ZERO);
        agingSummary.put("61-90 days", BigDecimal.ZERO);
        agingSummary.put("90+ days", BigDecimal.ZERO);

        for (Object[] row : outstandingData) {
            UUID partyId = (UUID) row[0];
            BigDecimal balance = (BigDecimal) row[1];
            if (balance.compareTo(BigDecimal.ZERO) <= 0) continue;

            totalOutstanding = totalOutstanding.add(balance);
            Party party = partyRepository.findById(partyId).orElse(null);

            List<LedgerEntry> entries = ledgerEntryRepository
                    .findByBusinessIdAndPartyIdOrderByEntryDateDesc(businessId, partyId);
            int daysOverdue = 0;
            LocalDate lastDate = null;
            if (!entries.isEmpty()) {
                lastDate = entries.get(0).getEntryDate();
                daysOverdue = (int) ChronoUnit.DAYS.between(lastDate, LocalDate.now());
            }

            String bucket = daysOverdue <= 30 ? "0-30 days" :
                    daysOverdue <= 60 ? "31-60 days" :
                            daysOverdue <= 90 ? "61-90 days" : "90+ days";
            agingSummary.merge(bucket, balance, BigDecimal::add);

            partyWise.add(OutstandingDto.builder()
                    .partyId(partyId)
                    .partyName(party != null ? party.getName() : "Unknown")
                    .phone(party != null ? party.getPhone() : null)
                    .totalOutstanding(balance)
                    .overdueAmount(daysOverdue > 0 ? balance : BigDecimal.ZERO)
                    .daysOverdue(daysOverdue)
                    .creditLimit(party != null ? party.getCreditLimit() : null)
                    .lastTransactionDate(lastDate)
                    .build());
        }

        return OutstandingReportDto.builder()
                .totalOutstanding(totalOutstanding)
                .partyWise(partyWise)
                .agingSummary(agingSummary)
                .build();
    }

    @Transactional(readOnly = true)
    public StockReportDto generateStockReport(UUID businessId) {
        log.info("Generating stock report for business: {}", businessId);

        List<Item> items = itemRepository.findByBusinessIdAndIsActiveTrue(businessId);
        long totalItems = items.size();
        BigDecimal totalStockValue = BigDecimal.ZERO;

        for (Item item : items) {
            BigDecimal stock = inventoryRepository.getStockByItemId(businessId, item.getId());
            if (stock != null && item.getPurchasePrice() != null) {
                totalStockValue = totalStockValue.add(stock.multiply(item.getPurchasePrice()));
            }
        }

        List<Map<String, Object>> categoryWiseStock = new ArrayList<>();
        Map<UUID, List<Item>> byCategory = items.stream()
                .filter(i -> i.getCategoryId() != null)
                .collect(Collectors.groupingBy(Item::getCategoryId));

        for (Map.Entry<UUID, List<Item>> entry : byCategory.entrySet()) {
            UUID catId = entry.getKey();
            List<Item> catItems = entry.getValue();
            BigDecimal catStockValue = BigDecimal.ZERO;
            BigDecimal catQty = BigDecimal.ZERO;

            for (Item item : catItems) {
                BigDecimal stock = inventoryRepository.getStockByItemId(businessId, item.getId());
                if (stock != null) {
                    catQty = catQty.add(stock);
                    if (item.getPurchasePrice() != null) {
                        catStockValue = catStockValue.add(stock.multiply(item.getPurchasePrice()));
                    }
                }
            }

            Map<String, Object> catData = new HashMap<>();
            catData.put("categoryId", catId);
            catData.put("itemCount", catItems.size());
            catData.put("totalQuantity", catQty);
            catData.put("totalValue", catStockValue);
            categoryWiseStock.add(catData);
        }

        List<StockAlertDto> lowStockItems = items.stream()
                .filter(i -> i.getCurrentStock() != null && i.getMinStockLevel() != null
                        && i.getCurrentStock().compareTo(i.getMinStockLevel()) <= 0)
                .map(i -> StockAlertDto.builder()
                        .itemId(i.getId())
                        .itemName(i.getName())
                        .sku(i.getSku())
                        .currentStock(i.getCurrentStock())
                        .minStockLevel(i.getMinStockLevel())
                        .difference(i.getMinStockLevel().subtract(i.getCurrentStock()))
                        .build())
                .toList();

        return StockReportDto.builder()
                .totalItems(totalItems)
                .totalStockValue(totalStockValue)
                .lowStockItems(lowStockItems)
                .categoryWiseStock(categoryWiseStock)
                .build();
    }

    @Transactional(readOnly = true)
    public GstReportDto generateGstReport(UUID businessId, LocalDate startDate, LocalDate endDate) {
        log.info("Generating GST report for business: {}", businessId);

        List<Invoice> invoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, startDate, endDate);

        BigDecimal totalOutputGst = invoices.stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.TAX_INVOICE)
                .map(inv -> inv.getTotalGst() != null ? inv.getTotalGst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalInputGst = invoices.stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.PURCHASE_BILL)
                .map(inv -> inv.getTotalGst() != null ? inv.getTotalGst() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netGstPayable = totalOutputGst.subtract(totalInputGst);
        if (netGstPayable.compareTo(BigDecimal.ZERO) < 0) netGstPayable = BigDecimal.ZERO;

        List<Map<String, Object>> invoiceWise = new ArrayList<>();
        for (Invoice inv : invoices) {
            if (inv.getTotalGst() != null && inv.getTotalGst().compareTo(BigDecimal.ZERO) > 0) {
                Map<String, Object> invData = new HashMap<>();
                invData.put("invoiceNo", inv.getInvoiceNo());
                invData.put("date", inv.getInvoiceDate());
                invData.put("type", inv.getInvoiceType().name());
                invData.put("taxableAmount", inv.getTaxableAmount());
                invData.put("cgst", inv.getCgst());
                invData.put("sgst", inv.getSgst());
                invData.put("igst", inv.getIgst());
                invData.put("totalGst", inv.getTotalGst());
                invoiceWise.add(invData);
            }
        }

        List<Map<String, Object>> hsnWiseSummary = new ArrayList<>();
        Map<String, BigDecimal> hsnTaxable = new HashMap<>();
        Map<String, BigDecimal> hsnGst = new HashMap<>();

        for (Invoice inv : invoices) {
            List<InvoiceItem> items = invoiceItemRepository.findByBusinessIdAndInvoiceId(businessId, inv.getId());
            for (InvoiceItem item : items) {
                String hsn = item.getHsnCode() != null ? item.getHsnCode() : "OTHER";
                hsnTaxable.merge(hsn, item.getTaxableAmount() != null ? item.getTaxableAmount() : BigDecimal.ZERO, BigDecimal::add);
                BigDecimal itemGst = (item.getCgst() != null ? item.getCgst() : BigDecimal.ZERO)
                        .add(item.getSgst() != null ? item.getSgst() : BigDecimal.ZERO)
                        .add(item.getIgst() != null ? item.getIgst() : BigDecimal.ZERO);
                hsnGst.merge(hsn, itemGst, BigDecimal::add);
            }
        }

        for (Map.Entry<String, BigDecimal> entry : hsnTaxable.entrySet()) {
            Map<String, Object> hsnData = new HashMap<>();
            hsnData.put("hsnCode", entry.getKey());
            hsnData.put("taxableValue", entry.getValue());
            hsnData.put("totalGst", hsnGst.getOrDefault(entry.getKey(), BigDecimal.ZERO));
            hsnWiseSummary.add(hsnData);
        }

        return GstReportDto.builder()
                .period(startDate + " to " + endDate)
                .totalOutputGst(totalOutputGst)
                .totalInputGst(totalInputGst)
                .netGstPayable(netGstPayable)
                .hsnWiseSummary(hsnWiseSummary)
                .invoiceWise(invoiceWise)
                .build();
    }

    @Transactional(readOnly = true)
    public ProfitLossDto generateProfitLoss(UUID businessId, ReportRequest request) {
        log.info("Generating profit/loss report for business: {}", businessId);

        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();

        List<Invoice> salesInvoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, startDate, endDate)
                .stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.TAX_INVOICE
                        || inv.getInvoiceType() == InvoiceType.RETAIL_INVOICE)
                .toList();

        List<Invoice> purchaseInvoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, startDate, endDate)
                .stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.PURCHASE_BILL)
                .toList();

        BigDecimal totalRevenue = salesInvoices.stream()
                .map(inv -> inv.getGrandTotal() != null ? inv.getGrandTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPurchases = purchaseInvoices.stream()
                .map(inv -> inv.getGrandTotal() != null ? inv.getGrandTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Expense> expenses = expenseRepository
                .findByBusinessIdAndExpenseDateBetween(businessId, startDate, endDate,
                        PageRequest.of(0, Integer.MAX_VALUE))
                .getContent();

        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grossProfit = totalRevenue.subtract(totalPurchases);
        BigDecimal netProfit = grossProfit.subtract(totalExpenses);

        Map<String, BigDecimal> expenseBreakdown = new HashMap<>();
        for (Expense expense : expenses) {
            String cat = expense.getCategory() != null ? expense.getCategory().name() : "OTHER";
            expenseBreakdown.merge(cat, expense.getAmount(), BigDecimal::add);
        }

        return ProfitLossDto.builder()
                .period(startDate + " to " + endDate)
                .totalRevenue(totalRevenue)
                .totalPurchases(totalPurchases)
                .totalExpenses(totalExpenses)
                .grossProfit(grossProfit)
                .netProfit(netProfit)
                .expenseBreakdown(expenseBreakdown)
                .build();
    }

    public byte[] exportReportToExcel(UUID businessId, String reportType, ReportRequest request) {
        log.info("Exporting {} report to Excel for business: {}", reportType, businessId);
        return new byte[0];
    }

    public byte[] exportReportToPdf(UUID businessId, String reportType, ReportRequest request) {
        log.info("Exporting {} report to PDF for business: {}", reportType, businessId);
        return new byte[0];
    }
}
