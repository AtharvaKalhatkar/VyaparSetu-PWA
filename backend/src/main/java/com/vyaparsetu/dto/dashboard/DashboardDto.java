package com.vyaparsetu.dto.dashboard;

import com.vyaparsetu.dto.item.StockAlertDto;
import com.vyaparsetu.dto.ledger.LedgerEntryDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDto {
    private BigDecimal todaySales;
    private BigDecimal monthlySales;
    private BigDecimal totalOutstanding;
    private BigDecimal totalExpenses;
    private BigDecimal todayProfit;
    private Long totalCustomers;
    private Long totalSuppliers;
    private Long totalProducts;
    private Map<String, BigDecimal> cashFlow;
    private List<TopProductDto> topProducts;
    private List<TopCustomerDto> topCustomers;
    private List<StockAlertDto> lowStockAlerts;
    private List<LedgerEntryDto> recentTransactions;
}
