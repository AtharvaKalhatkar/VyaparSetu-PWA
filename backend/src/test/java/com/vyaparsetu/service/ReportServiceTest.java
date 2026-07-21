package com.vyaparsetu.service;

import com.vyaparsetu.dto.report.*;
import com.vyaparsetu.entity.expense.Expense;
import com.vyaparsetu.entity.invoice.Invoice;
import com.vyaparsetu.entity.invoice.InvoiceItem;
import com.vyaparsetu.entity.ledger.LedgerEntry;
import com.vyaparsetu.repository.expense.ExpenseRepository;
import com.vyaparsetu.repository.inventory.InventoryRepository;
import com.vyaparsetu.repository.invoice.InvoiceItemRepository;
import com.vyaparsetu.repository.invoice.InvoiceRepository;
import com.vyaparsetu.repository.item.ItemRepository;
import com.vyaparsetu.repository.ledger.LedgerEntryRepository;
import com.vyaparsetu.repository.party.PartyRepository;
import com.vyaparsetu.service.report.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private InvoiceItemRepository invoiceItemRepository;
    @Mock
    private LedgerEntryRepository ledgerEntryRepository;
    @Mock
    private PartyRepository partyRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private ExpenseRepository expenseRepository;

    @InjectMocks
    private ReportService reportService;

    private UUID businessId;
    private UUID partyId;
    private Invoice salesInvoice;
    private Invoice purchaseInvoice;
    private InvoiceItem invoiceItem;
    private ReportRequest request;
    private Expense expense;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        partyId = UUID.randomUUID();

        salesInvoice = Invoice.builder()
                .id(UUID.randomUUID())
                .businessId(businessId)
                .invoiceNo("SALE-001")
                .invoiceType(Invoice.InvoiceType.TAX_INVOICE)
                .partyId(partyId)
                .invoiceDate(LocalDate.now())
                .grandTotal(new BigDecimal("1180"))
                .totalGst(new BigDecimal("180"))
                .discountAmount(BigDecimal.ZERO)
                .taxableAmount(new BigDecimal("1000"))
                .cgst(new BigDecimal("90"))
                .sgst(new BigDecimal("90"))
                .paidAmount(new BigDecimal("1180"))
                .build();

        purchaseInvoice = Invoice.builder()
                .id(UUID.randomUUID())
                .businessId(businessId)
                .invoiceNo("PUR-001")
                .invoiceType(Invoice.InvoiceType.PURCHASE_BILL)
                .partyId(partyId)
                .invoiceDate(LocalDate.now())
                .grandTotal(new BigDecimal("590"))
                .totalGst(new BigDecimal("90"))
                .taxableAmount(new BigDecimal("500"))
                .build();

        invoiceItem = InvoiceItem.builder()
                .id(UUID.randomUUID())
                .invoiceId(salesInvoice.getId())
                .itemId(UUID.randomUUID())
                .hsnCode("84713000")
                .taxableAmount(new BigDecimal("1000"))
                .cgst(new BigDecimal("90"))
                .sgst(new BigDecimal("90"))
                .build();

        request = ReportRequest.builder()
                .startDate(LocalDate.now().minusDays(30))
                .endDate(LocalDate.now())
                .build();

        expense = Expense.builder()
                .id(UUID.randomUUID())
                .businessId(businessId)
                .amount(new BigDecimal("200"))
                .category(Expense.ExpenseCategory.RENT)
                .build();
    }

    @Test
    @DisplayName("generateSalesReport should return aggregated sales data")
    void generateSalesReport_shouldReturnSalesData() {
        when(invoiceRepository.findByBusinessIdAndInvoiceDateBetween(eq(businessId), any(), any()))
                .thenReturn(List.of(salesInvoice));

        SalesReportDto result = reportService.generateSalesReport(businessId, request);

        assertThat(result).isNotNull();
        assertThat(result.getTotalInvoices()).isEqualTo(1);
        assertThat(result.getTotalSales()).isEqualByComparingTo(new BigDecimal("1180"));
        assertThat(result.getTotalTax()).isEqualByComparingTo(new BigDecimal("180"));
        assertThat(result.getAverageInvoiceValue()).isEqualByComparingTo(new BigDecimal("1180"));
        assertThat(result.getPaymentModeBreakdown()).isNotEmpty();
    }

    @Test
    @DisplayName("generateSalesReport should return zero for no invoices")
    void generateSalesReport_shouldReturnZero_whenNoData() {
        when(invoiceRepository.findByBusinessIdAndInvoiceDateBetween(eq(businessId), any(), any()))
                .thenReturn(List.of());

        SalesReportDto result = reportService.generateSalesReport(businessId, request);

        assertThat(result.getTotalInvoices()).isZero();
        assertThat(result.getTotalSales()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("generateOutstandingReport should return aging buckets")
    void generateOutstandingReport_shouldReturnAging() {
        Object[] row = new Object[]{partyId, new BigDecimal("5000")};
        when(ledgerEntryRepository.getOutstandingByBusinessId(businessId))
                .thenReturn(List.<Object[]>of(row));
        when(partyRepository.findById(partyId)).thenReturn(java.util.Optional.empty());
        when(ledgerEntryRepository.findByBusinessIdAndPartyIdOrderByEntryDateDesc(businessId, partyId))
                .thenReturn(List.of());

        OutstandingReportDto result = reportService.generateOutstandingReport(businessId);

        assertThat(result).isNotNull();
        assertThat(result.getTotalOutstanding()).isEqualByComparingTo(new BigDecimal("5000"));
        assertThat(result.getAgingSummary()).containsKey("0-30 days");
        assertThat(result.getPartyWise()).hasSize(1);
    }

    @Test
    @DisplayName("generateOutstandingReport should filter zero balance")
    void generateOutstandingReport_shouldFilterZeroBalance() {
        Object[] row = new Object[]{partyId, BigDecimal.ZERO};
        when(ledgerEntryRepository.getOutstandingByBusinessId(businessId))
                .thenReturn(List.<Object[]>of(row));

        OutstandingReportDto result = reportService.generateOutstandingReport(businessId);

        assertThat(result.getTotalOutstanding()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getPartyWise()).isEmpty();
    }

    @Test
    @DisplayName("generateGstReport should return HSN summary")
    void generateGstReport_shouldReturnHsnSummary() {
        when(invoiceRepository.findByBusinessIdAndInvoiceDateBetween(eq(businessId), any(), any()))
                .thenReturn(List.of(salesInvoice, purchaseInvoice));
        when(invoiceItemRepository.findByBusinessIdAndInvoiceId(eq(businessId), eq(salesInvoice.getId())))
                .thenReturn(List.of(invoiceItem));
        when(invoiceItemRepository.findByBusinessIdAndInvoiceId(eq(businessId), eq(purchaseInvoice.getId())))
                .thenReturn(List.of());

        GstReportDto result = reportService.generateGstReport(businessId, LocalDate.now().minusDays(30), LocalDate.now());

        assertThat(result).isNotNull();
        assertThat(result.getTotalOutputGst()).isEqualByComparingTo(new BigDecimal("180"));
        assertThat(result.getTotalInputGst()).isEqualByComparingTo(new BigDecimal("90"));
        assertThat(result.getNetGstPayable()).isEqualByComparingTo(new BigDecimal("90"));
        assertThat(result.getHsnWiseSummary()).hasSize(1);
    }

    @Test
    @DisplayName("generateProfitLoss should return P&L data")
    void generateProfitLoss_shouldReturnProfitLoss() {
        when(invoiceRepository.findByBusinessIdAndInvoiceDateBetween(eq(businessId), any(), any()))
                .thenReturn(List.of(salesInvoice, purchaseInvoice));
        when(expenseRepository.findByBusinessIdAndExpenseDateBetween(eq(businessId), any(), any(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(expense)));

        ProfitLossDto result = reportService.generateProfitLoss(businessId, request);

        assertThat(result).isNotNull();
        assertThat(result.getTotalRevenue()).isEqualByComparingTo(new BigDecimal("1180"));
        assertThat(result.getTotalPurchases()).isEqualByComparingTo(new BigDecimal("590"));
        assertThat(result.getTotalExpenses()).isEqualByComparingTo(new BigDecimal("200"));
        assertThat(result.getGrossProfit()).isEqualByComparingTo(new BigDecimal("590"));
        assertThat(result.getNetProfit()).isEqualByComparingTo(new BigDecimal("390"));
        assertThat(result.getExpenseBreakdown()).containsKey("RENT");
    }

    @Test
    @DisplayName("exportReportToExcel should return empty byte array")
    void exportReportToExcel_shouldReturnBytes() {
        byte[] result = reportService.exportReportToExcel(businessId, "SALES", request);
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("exportReportToPdf should return empty byte array")
    void exportReportToPdf_shouldReturnBytes() {
        byte[] result = reportService.exportReportToPdf(businessId, "SALES", request);
        assertThat(result).isEmpty();
    }
}
