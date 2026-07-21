package com.vyaparsetu.service.dashboard;

import com.vyaparsetu.dto.dashboard.CashFlowDto;
import com.vyaparsetu.dto.dashboard.DashboardDto;
import com.vyaparsetu.dto.dashboard.TopCustomerDto;
import com.vyaparsetu.dto.dashboard.TopProductDto;
import com.vyaparsetu.dto.item.StockAlertDto;
import com.vyaparsetu.dto.ledger.LedgerEntryDto;
import com.vyaparsetu.dto.mapper.ItemMapper;
import com.vyaparsetu.dto.mapper.LedgerEntryMapper;
import com.vyaparsetu.dto.mapper.PartyMapper;
import com.vyaparsetu.entity.invoice.Invoice;
import com.vyaparsetu.entity.invoice.Invoice.InvoiceType;
import com.vyaparsetu.entity.invoice.InvoiceItem;
import com.vyaparsetu.entity.item.Item;
import com.vyaparsetu.entity.ledger.LedgerEntry;
import com.vyaparsetu.entity.ledger.LedgerEntry.EntryType;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final PartyRepository partyRepository;
    private final ItemRepository itemRepository;
    private final InventoryRepository inventoryRepository;
    private final ExpenseRepository expenseRepository;
    private final LedgerEntryMapper ledgerEntryMapper;
    private final PartyMapper partyMapper;
    private final ItemMapper itemMapper;

    @Transactional(readOnly = true)
    public DashboardDto getDashboard(UUID businessId) {
        log.info("Building dashboard for business: {}", businessId);

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        BigDecimal todaySales = getTodaySales(businessId);
        BigDecimal monthlySales = getMonthlySales(businessId, today.getMonthValue(), today.getYear());
        BigDecimal totalOutstanding = getTotalOutstanding(businessId);
        BigDecimal totalExpenses = getTotalExpenses(businessId, monthStart, today);

        long totalCustomers = partyRepository.countByBusinessIdAndIsActiveTrue(businessId);
        long totalSuppliers = partyRepository.findByBusinessIdAndIsActiveTrue(businessId).stream()
                .filter(p -> p.getType() == Party.PartyType.SUPPLIER || p.getType() == Party.PartyType.BOTH)
                .count();
        long totalProducts = itemRepository.findByBusinessIdAndIsActiveTrue(businessId).size();

        Map<String, BigDecimal> cashFlow = getCashFlowMap(businessId, monthStart, today);
        List<TopProductDto> topProducts = getTopProducts(businessId, monthStart, today, 10);
        List<TopCustomerDto> topCustomers = getTopCustomers(businessId, monthStart, today, 10);
        List<StockAlertDto> lowStockAlerts = getLowStockAlerts(businessId);
        List<LedgerEntryDto> recentTransactions = getRecentTransactions(businessId, 10);

        return DashboardDto.builder()
                .todaySales(todaySales)
                .monthlySales(monthlySales)
                .totalOutstanding(totalOutstanding)
                .totalExpenses(totalExpenses)
                .todayProfit(todaySales.subtract(totalExpenses))
                .totalCustomers(totalCustomers)
                .totalSuppliers(totalSuppliers)
                .totalProducts(totalProducts)
                .cashFlow(cashFlow)
                .topProducts(topProducts)
                .topCustomers(topCustomers)
                .lowStockAlerts(lowStockAlerts)
                .recentTransactions(recentTransactions)
                .build();
    }

    @Transactional(readOnly = true)
    public BigDecimal getTodaySales(UUID businessId) {
        LocalDate today = LocalDate.now();
        return getSalesInPeriod(businessId, today, today);
    }

    @Transactional(readOnly = true)
    public BigDecimal getMonthlySales(UUID businessId, Integer month, Integer year) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return getSalesInPeriod(businessId, start, end);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalOutstanding(UUID businessId) {
        return ledgerEntryRepository.getOutstandingByBusinessId(businessId).stream()
                .map(row -> (BigDecimal) row[1])
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalExpenses(UUID businessId, LocalDate startDate, LocalDate endDate) {
        return expenseRepository.findByBusinessIdAndExpenseDateBetween(businessId, startDate, endDate,
                        org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE))
                .getContent().stream()
                .map(com.vyaparsetu.entity.expense.Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getCashFlow(UUID businessId, LocalDate startDate, LocalDate endDate) {
        return getCashFlowMap(businessId, startDate, endDate);
    }

    @Transactional(readOnly = true)
    public List<TopProductDto> getTopProducts(UUID businessId, LocalDate startDate, LocalDate endDate, int limit) {
        List<Invoice> invoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, startDate, endDate);
        Map<UUID, BigDecimal> productQuantities = new HashMap<>();
        Map<UUID, BigDecimal> productRevenues = new HashMap<>();

        for (Invoice invoice : invoices) {
            List<InvoiceItem> items = invoiceItemRepository.findByBusinessIdAndInvoiceId(businessId, invoice.getId());
            for (InvoiceItem item : items) {
                productQuantities.merge(item.getItemId(), item.getQuantity(), BigDecimal::add);
                productRevenues.merge(item.getItemId(), item.getTotalAmount() != null ? item.getTotalAmount() : BigDecimal.ZERO, BigDecimal::add);
            }
        }

        List<TopProductDto> topProducts = new ArrayList<>();
        int rank = 1;
        for (Map.Entry<UUID, BigDecimal> entry : productQuantities.entrySet().stream()
                .sorted(Map.Entry.<UUID, BigDecimal>comparingByValue().reversed())
                .limit(limit).toList()) {
            Item item = itemRepository.findById(entry.getKey()).orElse(null);
            topProducts.add(TopProductDto.builder()
                    .itemId(entry.getKey())
                    .itemName(item != null ? item.getName() : "Unknown")
                    .totalQuantity(entry.getValue())
                    .totalRevenue(productRevenues.getOrDefault(entry.getKey(), BigDecimal.ZERO))
                    .rank(rank++)
                    .build());
        }
        return topProducts;
    }

    @Transactional(readOnly = true)
    public List<TopCustomerDto> getTopCustomers(UUID businessId, LocalDate startDate, LocalDate endDate, int limit) {
        List<Invoice> invoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, startDate, endDate);
        Map<UUID, BigDecimal> customerSales = new HashMap<>();
        Map<UUID, LocalDate> lastTransaction = new HashMap<>();

        for (Invoice invoice : invoices) {
            customerSales.merge(invoice.getPartyId(), invoice.getGrandTotal() != null ? invoice.getGrandTotal() : BigDecimal.ZERO, BigDecimal::add);
            if (invoice.getInvoiceDate() != null) {
                lastTransaction.merge(invoice.getPartyId(), invoice.getInvoiceDate(),
                        (existing, updated) -> updated.isAfter(existing) ? updated : existing);
            }
        }

        List<TopCustomerDto> topCustomers = new ArrayList<>();
        for (Map.Entry<UUID, BigDecimal> entry : customerSales.entrySet().stream()
                .sorted(Map.Entry.<UUID, BigDecimal>comparingByValue().reversed())
                .limit(limit).toList()) {
            Party party = partyRepository.findById(entry.getKey()).orElse(null);
            topCustomers.add(TopCustomerDto.builder()
                    .partyId(entry.getKey())
                    .partyName(party != null ? party.getName() : "Unknown")
                    .totalSales(entry.getValue())
                    .totalOutstanding(getPartyOutstanding(businessId, entry.getKey()))
                    .lastTransactionDate(lastTransaction.get(entry.getKey()))
                    .build());
        }
        return topCustomers;
    }

    @Transactional(readOnly = true)
    public List<StockAlertDto> getLowStockAlerts(UUID businessId) {
        List<Item> allItems = itemRepository.findByBusinessIdAndIsActiveTrue(businessId);
        return allItems.stream()
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
    }

    @Transactional(readOnly = true)
    public List<LedgerEntryDto> getRecentTransactions(UUID businessId, int limit) {
        List<LedgerEntry> entries = ledgerEntryRepository
                .findByBusinessId(businessId, org.springframework.data.domain.PageRequest.of(0, limit))
                .getContent();
        return ledgerEntryMapper.toDtoList(entries);
    }

    private BigDecimal getSalesInPeriod(UUID businessId, LocalDate start, LocalDate end) {
        List<Invoice> invoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, start, end);
        return invoices.stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.TAX_INVOICE
                        || inv.getInvoiceType() == InvoiceType.RETAIL_INVOICE)
                .map(inv -> inv.getGrandTotal() != null ? inv.getGrandTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Map<String, BigDecimal> getCashFlowMap(UUID businessId, LocalDate startDate, LocalDate endDate) {
        List<Invoice> invoices = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(businessId, startDate, endDate);
        BigDecimal inflow = invoices.stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.TAX_INVOICE
                        || inv.getInvoiceType() == InvoiceType.RETAIL_INVOICE)
                .map(inv -> inv.getPaidAmount() != null ? inv.getPaidAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outflow = expenseRepository
                .findByBusinessIdAndExpenseDateBetween(businessId, startDate, endDate,
                        org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE))
                .getContent().stream()
                .map(com.vyaparsetu.entity.expense.Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> cashFlow = new HashMap<>();
        cashFlow.put("inflow", inflow);
        cashFlow.put("outflow", outflow);
        cashFlow.put("netFlow", inflow.subtract(outflow));
        return cashFlow;
    }

    private BigDecimal getPartyOutstanding(UUID businessId, UUID partyId) {
        BigDecimal balance = ledgerEntryRepository.calculateBalanceByPartyId(businessId, partyId);
        return balance != null ? balance : BigDecimal.ZERO;
    }
}
