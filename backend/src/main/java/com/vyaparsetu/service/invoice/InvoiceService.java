package com.vyaparsetu.service.invoice;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.BadRequestException;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.invoice.InvoiceCreateRequest;
import com.vyaparsetu.dto.invoice.InvoiceDto;
import com.vyaparsetu.dto.invoice.InvoiceItemDto;
import com.vyaparsetu.dto.invoice.InvoiceItemRequest;
import com.vyaparsetu.dto.mapper.InvoiceItemMapper;
import com.vyaparsetu.dto.mapper.InvoiceMapper;
import com.vyaparsetu.entity.inventory.StockMovement;
import com.vyaparsetu.entity.inventory.StockMovement.MovementType;
import com.vyaparsetu.entity.invoice.Invoice;
import com.vyaparsetu.entity.invoice.Invoice.InvoiceStatus;
import com.vyaparsetu.entity.invoice.Invoice.InvoiceType;
import com.vyaparsetu.entity.invoice.InvoiceItem;
import com.vyaparsetu.entity.invoice.InvoiceSequence;
import com.vyaparsetu.entity.item.Item;
import com.vyaparsetu.entity.ledger.LedgerEntry;
import com.vyaparsetu.entity.ledger.LedgerEntry.EntryType;
import com.vyaparsetu.entity.ledger.LedgerEntry.TransactionType;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final InvoiceSequenceRepository invoiceSequenceRepository;
    private final PartyRepository partyRepository;
    private final ItemRepository itemRepository;
    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final LedgerBalanceRepository ledgerBalanceRepository;
    private final InvoiceMapper invoiceMapper;
    private final InvoiceItemMapper invoiceItemMapper;
    private final com.vyaparsetu.repository.inventory.WarehouseRepository warehouseRepository;
    private final AuditService auditService;

    @Transactional
    public InvoiceDto createInvoice(UUID businessId, InvoiceCreateRequest request) {
        log.info("Creating invoice in business: {}", businessId);

        Party party = partyRepository.findByBusinessIdAndId(businessId, request.getPartyId())
                .orElseThrow(() -> new ResourceNotFoundException("Party", request.getPartyId()));

        String invoiceNo = getNextInvoiceNumber(businessId, request.getInvoiceType());

        Invoice invoice = invoiceMapper.toEntity(request);
        invoice.setBusinessId(businessId);
        invoice.setInvoiceNo(invoiceNo);
        invoice.setInvoiceDate(request.getInvoiceDate() != null ? request.getInvoiceDate() : LocalDate.now());
        invoice.setStatus(InvoiceStatus.CONFIRMED);
        invoice.setBalanceDue(request.getGrandTotal() != null
                ? request.getGrandTotal().subtract(request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO)
                : BigDecimal.ZERO);
        invoice = invoiceRepository.save(invoice);

        List<InvoiceItem> invoiceItems = new ArrayList<>();
        if (request.getItems() != null) {
            int serialNo = 1;
            for (InvoiceItemRequest itemReq : request.getItems()) {
                Item item = itemRepository.findById(itemReq.getItemId())
                        .orElseThrow(() -> new ResourceNotFoundException("Item", itemReq.getItemId()));

                BigDecimal taxableAmount = itemReq.getQuantity().multiply(itemReq.getRate());
                BigDecimal discountAmt = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO;
                BigDecimal afterDiscount = taxableAmount.subtract(discountAmt);
                BigDecimal gstRate = itemReq.getGstRate() != null ? itemReq.getGstRate() : BigDecimal.ZERO;
                BigDecimal cgst = BigDecimal.ZERO;
                BigDecimal sgst = BigDecimal.ZERO;
                BigDecimal igst = BigDecimal.ZERO;

                if (gstRate.compareTo(BigDecimal.ZERO) > 0) {
                    cgst = afterDiscount.multiply(gstRate).divide(new BigDecimal("200"), 2, java.math.RoundingMode.HALF_UP);
                    sgst = cgst;
                }

                BigDecimal totalAmount = afterDiscount.add(cgst).add(sgst).add(igst);

                InvoiceItem invoiceItem = InvoiceItem.builder()
                        .businessId(businessId)
                        .invoiceId(invoice.getId())
                        .itemId(itemReq.getItemId())
                        .description(itemReq.getDescription())
                        .quantity(itemReq.getQuantity())
                        .unit(itemReq.getUnit())
                        .rate(itemReq.getRate())
                        .discountPercent(itemReq.getDiscountPercent())
                        .discountAmount(discountAmt)
                        .taxableAmount(afterDiscount)
                        .gstRate(gstRate)
                        .cgst(cgst)
                        .sgst(sgst)
                        .igst(igst)
                        .cess(itemReq.getGstRate() != null ? BigDecimal.ZERO : BigDecimal.ZERO)
                        .totalAmount(totalAmount)
                        .batchNo(itemReq.getBatchNo())
                        .expiryDate(itemReq.getExpiryDate())
                        .hsnCode(item.getHsnCode())
                        .serialNo(serialNo++)
                        .build();
                invoiceItems.add(invoiceItemRepository.save(invoiceItem));
            }
        }

        updateStockForInvoice(businessId, invoice, invoiceItems);
        createLedgerEntryForInvoice(businessId, invoice, party);

        auditService.logEvent(businessId.toString(), "CREATE_INVOICE", "Invoice", invoice.getId(),
                null, Map.of("invoiceNo", invoice.getInvoiceNo(), "partyId", party.getId().toString()));

        InvoiceDto dto = invoiceMapper.toDto(invoice);
        dto.setItems(invoiceItemMapper.toDtoList(invoiceItems));
        return dto;
    }

    @Transactional
    public InvoiceDto updateInvoice(UUID businessId, UUID invoiceId, InvoiceCreateRequest request) {
        log.info("Updating invoice: {} in business: {}", invoiceId, businessId);

        Invoice existingInvoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        reverseStockForInvoice(businessId, existingInvoice);
        reverseLedgerForInvoice(businessId, existingInvoice);

        List<InvoiceItem> oldItems = invoiceItemRepository.findByBusinessIdAndInvoiceId(businessId, invoiceId);
        oldItems.forEach(i -> i.setDeleted(true));
        invoiceItemRepository.saveAll(oldItems);

        existingInvoice.setDeleted(true);
        invoiceRepository.save(existingInvoice);

        return createInvoice(businessId, request);
    }

    @Transactional
    public void deleteInvoice(UUID businessId, UUID invoiceId) {
        log.info("Deleting invoice: {} in business: {}", invoiceId, businessId);

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        reverseStockForInvoice(businessId, invoice);
        reverseLedgerForInvoice(businessId, invoice);

        List<InvoiceItem> items = invoiceItemRepository.findByBusinessIdAndInvoiceId(businessId, invoiceId);
        items.forEach(i -> i.setDeleted(true));
        invoiceItemRepository.saveAll(items);

        invoice.setDeleted(true);
        invoiceRepository.save(invoice);

        auditService.logEvent(businessId.toString(), "DELETE_INVOICE", "Invoice", invoiceId, null, null);
    }

    @Transactional(readOnly = true)
    public InvoiceDto getInvoiceById(UUID businessId, UUID invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));
        InvoiceDto dto = invoiceMapper.toDto(invoice);
        List<InvoiceItem> items = invoiceItemRepository.findByBusinessIdAndInvoiceId(businessId, invoiceId);
        dto.setItems(invoiceItemMapper.toDtoList(items));
        return dto;
    }

    @Transactional(readOnly = true)
    public PagedResponse<InvoiceDto> getInvoicesByBusiness(UUID businessId, String status,
                                                            LocalDate startDate, LocalDate endDate, Pageable pageable) {
        Page<Invoice> invoicePage;
        if (status != null && !status.isBlank()) {
            invoicePage = invoiceRepository.findByBusinessIdAndStatus(businessId,
                    InvoiceStatus.valueOf(status.toUpperCase()), pageable);
        } else {
            invoicePage = invoiceRepository.findByBusinessId(businessId, pageable);
        }
        List<InvoiceDto> dtos = invoiceMapper.toDtoList(invoicePage.getContent());
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                invoicePage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public InvoiceDto getInvoiceByNumber(UUID businessId, String invoiceNo) {
        Invoice invoice = invoiceRepository.findByBusinessIdAndInvoiceNo(businessId, invoiceNo)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with number: " + invoiceNo));
        InvoiceDto dto = invoiceMapper.toDto(invoice);
        List<InvoiceItem> items = invoiceItemRepository.findByBusinessIdAndInvoiceId(businessId, invoice.getId());
        dto.setItems(invoiceItemMapper.toDtoList(items));
        return dto;
    }

    @Transactional
    public void cancelInvoice(UUID businessId, UUID invoiceId) {
        log.info("Cancelling invoice: {} in business: {}", invoiceId, businessId);

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new BadRequestException("Invoice is already cancelled");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        invoiceRepository.save(invoice);

        reverseStockForInvoice(businessId, invoice);
        reverseLedgerForInvoice(businessId, invoice);

        auditService.logEvent(businessId.toString(), "CANCEL_INVOICE", "Invoice", invoiceId,
                null, Map.of("invoiceNo", invoice.getInvoiceNo()));
    }

    public byte[] generateInvoicePdf(UUID businessId, UUID invoiceId) {
        log.info("Generating PDF for invoice: {} in business: {}", invoiceId, businessId);
        return new byte[0];
    }

    @Transactional
    public Map<String, Object> generateIrn(UUID businessId, UUID invoiceId) {
        log.info("Generating IRN for invoice: {} in business: {}", invoiceId, businessId);

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        String mockIrn = "IRN" + System.currentTimeMillis();
        invoice.setIrn(mockIrn);
        invoice.setIrnGeneratedAt(java.time.Instant.now());
        invoiceRepository.save(invoice);

        Map<String, Object> result = new HashMap<>();
        result.put("irn", mockIrn);
        result.put("ackNo", "ACK" + System.currentTimeMillis());
        result.put("ackDate", LocalDate.now().toString());
        return result;
    }

    @Transactional(readOnly = true)
    public String getNextInvoiceNumber(UUID businessId, String invoiceType) {
        if (invoiceType == null) invoiceType = "TAX_INVOICE";

        String currentFy = getCurrentFinancialYear();
        Optional<InvoiceSequence> seqOpt = invoiceSequenceRepository
                .findByBusinessIdAndInvoiceTypeAndFinancialYear(businessId, invoiceType, currentFy);

        InvoiceSequence sequence;
        if (seqOpt.isPresent()) {
            sequence = seqOpt.get();
            sequence.setSequence(sequence.getSequence() + 1);
        } else {
            sequence = InvoiceSequence.builder()
                    .businessId(businessId)
                    .prefix(invoiceType.substring(0, 3) + "-")
                    .sequence(1L)
                    .format("PREFIX-SEQ-SUFFIX")
                    .invoiceType(invoiceType)
                    .financialYear(currentFy)
                    .build();
        }
        sequence = invoiceSequenceRepository.save(sequence);

        String prefix = sequence.getPrefix() != null ? sequence.getPrefix() : "";
        String suffix = sequence.getSuffix() != null ? sequence.getSuffix() : "";
        return prefix + String.format("%06d", sequence.getSequence()) + suffix;
    }

    @Transactional
    public InvoiceSequence createInvoiceSequence(UUID businessId, InvoiceSequence seq) {
        log.info("Creating invoice sequence for business: {}", businessId);
        seq.setBusinessId(businessId);
        return invoiceSequenceRepository.save(seq);
    }

    private void updateStockForInvoice(UUID businessId, Invoice invoice, List<InvoiceItem> items) {
        for (InvoiceItem item : items) {
            if (invoice.getInvoiceType() == InvoiceType.PURCHASE_BILL
                    || invoice.getInvoiceType() == InvoiceType.PURCHASE_RETURN) continue;

            inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(businessId, item.getItemId(),
                            getPrimaryWarehouseId(businessId))
                    .ifPresentOrElse(inv -> {
                        inv.setQuantity(inv.getQuantity().subtract(item.getQuantity()));
                        inventoryRepository.save(inv);
                    }, () -> log.warn("No inventory found for item: {}", item.getItemId()));

            Item inventoryItem = itemRepository.findById(item.getItemId()).orElse(null);
            if (inventoryItem != null) {
                inventoryItem.setCurrentStock(inventoryItem.getCurrentStock().subtract(item.getQuantity()));
                itemRepository.save(inventoryItem);
            }

            StockMovement movement = StockMovement.builder()
                    .businessId(businessId)
                    .itemId(item.getItemId())
                    .warehouseId(getPrimaryWarehouseId(businessId))
                    .movementType(MovementType.SALE)
                    .quantity(item.getQuantity())
                    .referenceType("INVOICE")
                    .referenceId(invoice.getId())
                    .unitPrice(item.getRate())
                    .totalAmount(item.getTotalAmount())
                    .build();
            stockMovementRepository.save(movement);
        }
    }

    private void reverseStockForInvoice(UUID businessId, Invoice invoice) {
        List<InvoiceItem> items = invoiceItemRepository.findByBusinessIdAndInvoiceId(businessId, invoice.getId());
        for (InvoiceItem item : items) {
            inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(businessId, item.getItemId(),
                            getPrimaryWarehouseId(businessId))
                    .ifPresent(inv -> {
                        inv.setQuantity(inv.getQuantity().add(item.getQuantity()));
                        inventoryRepository.save(inv);
                    });

            Item inventoryItem = itemRepository.findById(item.getItemId()).orElse(null);
            if (inventoryItem != null) {
                inventoryItem.setCurrentStock(inventoryItem.getCurrentStock().add(item.getQuantity()));
                itemRepository.save(inventoryItem);
            }
        }
    }

    private void createLedgerEntryForInvoice(UUID businessId, Invoice invoice, Party party) {
        LedgerEntry ledgerEntry = LedgerEntry.builder()
                .businessId(businessId)
                .partyId(party.getId())
                .invoiceId(invoice.getId())
                .transactionType(invoice.getInvoiceType().name().contains("PURCHASE")
                        ? TransactionType.PURCHASE : TransactionType.SALE)
                .entryType(invoice.getInvoiceType().name().contains("PURCHASE")
                        ? EntryType.CREDIT : EntryType.DEBIT)
                .amount(invoice.getGrandTotal() != null ? invoice.getGrandTotal() : BigDecimal.ZERO)
                .balanceAfter(invoice.getGrandTotal())
                .mode(LedgerEntry.PaymentMode.CREDIT)
                .reference(invoice.getInvoiceNo())
                .entryDate(invoice.getInvoiceDate())
                .dueDate(invoice.getDueDate())
                .invoiceNo(invoice.getInvoiceNo())
                .build();
        ledgerEntryRepository.save(ledgerEntry);
    }

    private void reverseLedgerForInvoice(UUID businessId, Invoice invoice) {
        List<LedgerEntry> entries = ledgerEntryRepository.findByBusinessIdAndPartyIdOrderByEntryDateDesc(businessId, invoice.getPartyId());
        for (LedgerEntry entry : entries) {
            if (invoice.getId().equals(entry.getInvoiceId())) {
                LedgerEntry reversal = LedgerEntry.builder()
                        .businessId(businessId)
                        .partyId(entry.getPartyId())
                        .invoiceId(invoice.getId())
                        .transactionType(entry.getTransactionType())
                        .entryType(entry.getEntryType() == EntryType.DEBIT ? EntryType.CREDIT : EntryType.DEBIT)
                        .amount(entry.getAmount())
                        .mode(entry.getMode())
                        .reference("REVERSAL-" + invoice.getInvoiceNo())
                        .entryDate(LocalDate.now())
                        .build();
                ledgerEntryRepository.save(reversal);
            }
        }
    }

    private UUID getPrimaryWarehouseId(UUID businessId) {
        return warehouseRepository.findByBusinessIdAndIsPrimaryTrue(businessId)
                .map(com.vyaparsetu.entity.inventory.Warehouse::getId)
                .orElse(null);
    }

    private String getCurrentFinancialYear() {
        int year = LocalDate.now().getYear();
        int month = LocalDate.now().getMonthValue();
        if (month >= 4) {
            return year + "-" + (year + 1);
        }
        return (year - 1) + "-" + year;
    }

}
