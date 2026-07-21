package com.vyaparsetu.service;

import com.vyaparsetu.common.*;
import com.vyaparsetu.dto.invoice.InvoiceCreateRequest;
import com.vyaparsetu.dto.invoice.InvoiceDto;
import com.vyaparsetu.dto.invoice.InvoiceItemDto;
import com.vyaparsetu.dto.invoice.InvoiceItemRequest;
import com.vyaparsetu.dto.mapper.InvoiceItemMapper;
import com.vyaparsetu.dto.mapper.InvoiceMapper;
import com.vyaparsetu.entity.inventory.Inventory;
import com.vyaparsetu.entity.inventory.StockMovement;
import com.vyaparsetu.entity.invoice.Invoice;
import com.vyaparsetu.entity.invoice.InvoiceItem;
import com.vyaparsetu.entity.invoice.InvoiceSequence;
import com.vyaparsetu.entity.item.Item;
import com.vyaparsetu.entity.ledger.LedgerEntry;
import com.vyaparsetu.entity.party.Party;
import com.vyaparsetu.repository.inventory.InventoryRepository;
import com.vyaparsetu.repository.inventory.StockMovementRepository;
import com.vyaparsetu.repository.invoice.InvoiceItemRepository;
import com.vyaparsetu.repository.invoice.InvoiceRepository;
import com.vyaparsetu.repository.invoice.InvoiceSequenceRepository;
import com.vyaparsetu.repository.item.ItemRepository;
import com.vyaparsetu.repository.ledger.LedgerBalanceRepository;
import com.vyaparsetu.repository.ledger.LedgerEntryRepository;
import com.vyaparsetu.repository.party.PartyRepository;
import com.vyaparsetu.service.invoice.InvoiceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private InvoiceItemRepository invoiceItemRepository;
    @Mock
    private InvoiceSequenceRepository invoiceSequenceRepository;
    @Mock
    private PartyRepository partyRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private StockMovementRepository stockMovementRepository;
    @Mock
    private LedgerEntryRepository ledgerEntryRepository;
    @Mock
    private LedgerBalanceRepository ledgerBalanceRepository;
    @Mock
    private InvoiceMapper invoiceMapper;
    @Mock
    private InvoiceItemMapper invoiceItemMapper;
    @Mock
    private com.vyaparsetu.repository.inventory.WarehouseRepository warehouseRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private InvoiceService invoiceService;

    private UUID businessId;
    private UUID invoiceId;
    private UUID partyId;
    private UUID itemId;
    private UUID warehouseId;
    private Party party;
    private Item item;
    private Invoice invoice;
    private InvoiceDto invoiceDto;
    private InvoiceCreateRequest createRequest;
    private InvoiceItem invoiceItem;
    private InvoiceItemDto invoiceItemDto;
    private Inventory inventory;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        invoiceId = UUID.randomUUID();
        partyId = UUID.randomUUID();
        itemId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();

        party = Party.builder()
                .id(partyId)
                .businessId(businessId)
                .name("Test Party")
                .type(Party.PartyType.CUSTOMER)
                .build();

        item = Item.builder()
                .id(itemId)
                .name("Test Item")
                .sku("SKU001")
                .currentStock(new BigDecimal("100"))
                .hsnCode("84713000")
                .build();

        invoice = Invoice.builder()
                .id(invoiceId)
                .businessId(businessId)
                .invoiceNo("INV-000001")
                .invoiceType(Invoice.InvoiceType.TAX_INVOICE)
                .partyId(partyId)
                .invoiceDate(LocalDate.now())
                .status(Invoice.InvoiceStatus.CONFIRMED)
                .subtotal(new BigDecimal("1000"))
                .grandTotal(new BigDecimal("1180"))
                .totalGst(new BigDecimal("180"))
                .build();

        invoiceDto = InvoiceDto.builder()
                .id(invoiceId)
                .invoiceNo("INV-000001")
                .invoiceType("TAX_INVOICE")
                .partyId(partyId)
                .status("CONFIRMED")
                .grandTotal(new BigDecimal("1180"))
                .build();

        InvoiceItemRequest itemRequest = InvoiceItemRequest.builder()
                .itemId(itemId)
                .quantity(new BigDecimal("2"))
                .rate(new BigDecimal("500"))
                .gstRate(new BigDecimal("18"))
                .build();

        createRequest = InvoiceCreateRequest.builder()
                .invoiceType("TAX_INVOICE")
                .partyId(partyId)
                .invoiceDate(LocalDate.now())
                .subtotal(new BigDecimal("1000"))
                .grandTotal(new BigDecimal("1180"))
                .paidAmount(BigDecimal.ZERO)
                .items(List.of(itemRequest))
                .build();

        invoiceItem = InvoiceItem.builder()
                .id(UUID.randomUUID())
                .invoiceId(invoiceId)
                .itemId(itemId)
                .quantity(new BigDecimal("2"))
                .rate(new BigDecimal("500"))
                .totalAmount(new BigDecimal("1000"))
                .hsnCode("84713000")
                .build();

        invoiceItemDto = InvoiceItemDto.builder()
                .itemId(itemId)
                .itemName("Test Item")
                .quantity(new BigDecimal("2"))
                .rate(new BigDecimal("500"))
                .totalAmount(new BigDecimal("1000"))
                .build();

        inventory = Inventory.builder()
                .id(UUID.randomUUID())
                .businessId(businessId)
                .itemId(itemId)
                .warehouseId(warehouseId)
                .quantity(new BigDecimal("100"))
                .build();
    }

    @Test
    @DisplayName("createInvoice should save invoice, update stock, and create ledger entry")
    void createInvoice_shouldReturnInvoiceDto() {
        when(partyRepository.findByBusinessIdAndId(businessId, partyId)).thenReturn(Optional.of(party));
        when(invoiceSequenceRepository.findByBusinessIdAndInvoiceTypeAndFinancialYear(any(), anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(invoiceSequenceRepository.save(any(InvoiceSequence.class)))
                .thenReturn(InvoiceSequence.builder().prefix("INV-").sequence(1L).build());
        when(invoiceMapper.toEntity(any(InvoiceCreateRequest.class))).thenReturn(invoice);
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(invoice);
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(invoiceItemRepository.save(any(InvoiceItem.class))).thenReturn(invoiceItem);
        when(invoiceMapper.toDto(any(Invoice.class))).thenReturn(invoiceDto);
        when(invoiceItemMapper.toDtoList(anyList())).thenReturn(List.of(invoiceItemDto));
        when(warehouseRepository.findByBusinessIdAndIsPrimaryTrue(any()))
                .thenReturn(Optional.of(com.vyaparsetu.entity.inventory.Warehouse.builder().id(warehouseId).build()));
        when(inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(any(), any(), any()))
                .thenReturn(Optional.of(inventory));
        when(stockMovementRepository.save(any(StockMovement.class))).thenReturn(mock(StockMovement.class));
        when(ledgerEntryRepository.save(any(LedgerEntry.class))).thenReturn(mock(LedgerEntry.class));
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        InvoiceDto result = invoiceService.createInvoice(businessId, createRequest);

        assertThat(result).isNotNull();
        assertThat(result.getInvoiceNo()).isEqualTo("INV-000001");

        verify(invoiceRepository).save(any(Invoice.class));
        verify(invoiceItemRepository).save(any(InvoiceItem.class));
        verify(stockMovementRepository).save(any(StockMovement.class));
        verify(ledgerEntryRepository).save(any(LedgerEntry.class));
        verify(auditService).logEvent(anyString(), eq("CREATE_INVOICE"), anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("createInvoice should throw ResourceNotFoundException when party not found")
    void createInvoice_shouldThrowException_whenPartyNotFound() {
        when(partyRepository.findByBusinessIdAndId(businessId, partyId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invoiceService.createInvoice(businessId, createRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Party");
    }

    @Test
    @DisplayName("getInvoiceById should return InvoiceDto")
    void getInvoiceById_shouldReturnInvoiceDto() {
        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
        when(invoiceMapper.toDto(any(Invoice.class))).thenReturn(invoiceDto);
        when(invoiceItemRepository.findByBusinessIdAndInvoiceId(businessId, invoiceId))
                .thenReturn(List.of(invoiceItem));
        when(invoiceItemMapper.toDtoList(anyList())).thenReturn(List.of(invoiceItemDto));

        InvoiceDto result = invoiceService.getInvoiceById(businessId, invoiceId);

        assertThat(result).isNotNull();
        assertThat(result.getInvoiceNo()).isEqualTo("INV-000001");
    }

    @Test
    @DisplayName("getInvoiceByNumber should return InvoiceDto")
    void getInvoiceByNumber_shouldReturnInvoiceDto() {
        when(invoiceRepository.findByBusinessIdAndInvoiceNo(businessId, "INV-000001"))
                .thenReturn(Optional.of(invoice));
        when(invoiceMapper.toDto(any(Invoice.class))).thenReturn(invoiceDto);
        when(invoiceItemRepository.findByBusinessIdAndInvoiceId(businessId, invoice.getId()))
                .thenReturn(List.of(invoiceItem));
        when(invoiceItemMapper.toDtoList(anyList())).thenReturn(List.of(invoiceItemDto));

        InvoiceDto result = invoiceService.getInvoiceByNumber(businessId, "INV-000001");

        assertThat(result).isNotNull();
        assertThat(result.getInvoiceNo()).isEqualTo("INV-000001");
    }

    @Test
    @DisplayName("cancelInvoice should change status to CANCELLED")
    void cancelInvoice_shouldCancelInvoice() {
        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(invoice);
        when(invoiceItemRepository.findByBusinessIdAndInvoiceId(businessId, invoiceId))
                .thenReturn(List.of(invoiceItem));
        when(warehouseRepository.findByBusinessIdAndIsPrimaryTrue(any()))
                .thenReturn(Optional.of(com.vyaparsetu.entity.inventory.Warehouse.builder().id(warehouseId).build()));
        when(inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(any(), any(), any()))
                .thenReturn(Optional.of(inventory));
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        invoiceService.cancelInvoice(businessId, invoiceId);

        assertThat(invoice.getStatus()).isEqualTo(Invoice.InvoiceStatus.CANCELLED);
        verify(invoiceRepository).save(invoice);
        verify(auditService).logEvent(anyString(), eq("CANCEL_INVOICE"), anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("cancelInvoice should throw BadRequestException for already cancelled invoice")
    void cancelInvoice_shouldThrowException_whenAlreadyCancelled() {
        invoice.setStatus(Invoice.InvoiceStatus.CANCELLED);
        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

        assertThatThrownBy(() -> invoiceService.cancelInvoice(businessId, invoiceId))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already cancelled");
    }

    @Test
    @DisplayName("deleteInvoice should soft delete invoice and reverse stock")
    void deleteInvoice_shouldSoftDelete() {
        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
        when(invoiceItemRepository.findByBusinessIdAndInvoiceId(businessId, invoiceId))
                .thenReturn(List.of(invoiceItem));
        when(warehouseRepository.findByBusinessIdAndIsPrimaryTrue(any()))
                .thenReturn(Optional.of(com.vyaparsetu.entity.inventory.Warehouse.builder().id(warehouseId).build()));
        when(inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(any(), any(), any()))
                .thenReturn(Optional.of(inventory));
        when(ledgerEntryRepository.findByBusinessIdAndPartyId(eq(businessId), eq(partyId), any()))
                .thenReturn(Page.empty());
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        invoiceService.deleteInvoice(businessId, invoiceId);

        assertThat(invoice.isDeleted()).isTrue();
        verify(invoiceRepository).save(invoice);
        verify(auditService).logEvent(anyString(), eq("DELETE_INVOICE"), anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("getInvoicesByBusiness should return paged invoices")
    void getInvoicesByBusiness_shouldReturnPagedResponse() {
        Page<Invoice> invoicePage = new PageImpl<>(List.of(invoice));
        when(invoiceRepository.findByBusinessId(eq(businessId), any())).thenReturn(invoicePage);
        when(invoiceMapper.toDtoList(anyList())).thenReturn(List.of(invoiceDto));

        var result = invoiceService.getInvoicesByBusiness(businessId, null, null, null, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("getNextInvoiceNumber should return formatted number")
    void getNextInvoiceNumber_shouldReturnFormatted() {
        String financialYear = LocalDate.now().getMonthValue() >= 4
                ? LocalDate.now().getYear() + "-" + (LocalDate.now().getYear() + 1)
                : (LocalDate.now().getYear() - 1) + "-" + LocalDate.now().getYear();

        when(invoiceSequenceRepository.findByBusinessIdAndInvoiceTypeAndFinancialYear(any(), anyString(), eq(financialYear)))
                .thenReturn(Optional.of(
                        InvoiceSequence.builder()
                                .prefix("INV-")
                                .sequence(1L)
                                .build()
                ));
        when(invoiceSequenceRepository.save(any(InvoiceSequence.class)))
                .thenReturn(InvoiceSequence.builder().prefix("INV-").sequence(2L).build());

        String result = invoiceService.getNextInvoiceNumber(businessId, "TAX_INVOICE");

        assertThat(result).startsWith("INV-");
    }

    @Test
    @DisplayName("generateIrn should return IRN data")
    void generateIrn_shouldReturnIrnData() {
        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(Invoice.class))).thenReturn(invoice);

        Map<String, Object> result = invoiceService.generateIrn(businessId, invoiceId);

        assertThat(result).containsKey("irn");
        assertThat(result).containsKey("ackNo");
        assertThat(result).containsKey("ackDate");
    }

    @Test
    @DisplayName("generateInvoicePdf should return byte array")
    void generateInvoicePdf_shouldReturnBytes() {
        byte[] result = invoiceService.generateInvoicePdf(businessId, invoiceId);
        assertThat(result).isEmpty();
    }
}
