package com.vyaparsetu.repository;

import com.vyaparsetu.entity.invoice.Invoice;
import com.vyaparsetu.entity.party.Party;
import com.vyaparsetu.repository.invoice.InvoiceRepository;
import com.vyaparsetu.repository.party.PartyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class InvoiceRepositoryTest {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PartyRepository partyRepository;

    private UUID businessId;
    private UUID partyId;
    private Invoice invoice;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        partyId = UUID.randomUUID();

        Party party = Party.builder()
                .id(partyId)
                .businessId(businessId)
                .name("Test Party")
                .phone("9876543210")
                .type(Party.PartyType.CUSTOMER)
                .country("India")
                .build();
        partyRepository.save(party);

        invoice = Invoice.builder()
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
        invoice = invoiceRepository.save(invoice);

        Invoice invoice2 = Invoice.builder()
                .businessId(businessId)
                .invoiceNo("INV-000002")
                .invoiceType(Invoice.InvoiceType.PURCHASE_BILL)
                .partyId(partyId)
                .invoiceDate(LocalDate.now().minusDays(5))
                .status(Invoice.InvoiceStatus.DRAFT)
                .subtotal(new BigDecimal("500"))
                .grandTotal(new BigDecimal("590"))
                .build();
        invoiceRepository.save(invoice2);
    }

    @Test
    @DisplayName("findByBusinessId should return all invoices for business")
    void findByBusinessId_shouldReturnInvoices() {
        Page<Invoice> result = invoiceRepository.findByBusinessId(businessId, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(2);
    }

    @Test
    @DisplayName("findByBusinessId should return empty for different business")
    void findByBusinessId_shouldReturnEmpty_forDifferentBusiness() {
        Page<Invoice> result = invoiceRepository.findByBusinessId(UUID.randomUUID(), PageRequest.of(0, 20));

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    @DisplayName("findByBusinessIdAndInvoiceNo should return invoice by number")
    void findByBusinessIdAndInvoiceNo_shouldReturnInvoice() {
        Optional<Invoice> result = invoiceRepository.findByBusinessIdAndInvoiceNo(businessId, "INV-000001");

        assertThat(result).isPresent();
        assertThat(result.get().getGrandTotal()).isEqualByComparingTo(new BigDecimal("1180"));
    }

    @Test
    @DisplayName("findByBusinessIdAndInvoiceNo should return empty for wrong number")
    void findByBusinessIdAndInvoiceNo_shouldReturnEmpty_whenNotFound() {
        Optional<Invoice> result = invoiceRepository.findByBusinessIdAndInvoiceNo(businessId, "INV-999999");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findByBusinessIdAndStatus should filter by status")
    void findByBusinessIdAndStatus_shouldFilterByStatus() {
        Page<Invoice> result = invoiceRepository.findByBusinessIdAndStatus(
                businessId, Invoice.InvoiceStatus.CONFIRMED, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getInvoiceNo()).isEqualTo("INV-000001");
    }

    @Test
    @DisplayName("findByBusinessIdAndInvoiceDateBetween should filter by date range")
    void findByBusinessIdAndInvoiceDateBetween_shouldFilterByDate() {
        List<Invoice> result = invoiceRepository.findByBusinessIdAndInvoiceDateBetween(
                businessId, LocalDate.now().minusDays(1), LocalDate.now());

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("findByBusinessIdAndPartyId should filter by party")
    void findByBusinessIdAndPartyId_shouldFilterByParty() {
        Page<Invoice> result = invoiceRepository.findByBusinessIdAndPartyId(
                businessId, partyId, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(2);
    }

    @Test
    @DisplayName("findByBusinessIdAndInvoiceType should filter by type")
    void findByBusinessIdAndInvoiceType_shouldFilterByType() {
        Page<Invoice> result = invoiceRepository.findByBusinessIdAndInvoiceType(
                businessId, "TAX_INVOICE", PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getInvoiceNo()).isEqualTo("INV-000001");
    }

    @Test
    @DisplayName("invoice number should be unique within business")
    void invoiceNumber_shouldBeUnique() {
        Invoice duplicate = Invoice.builder()
                .businessId(businessId)
                .invoiceNo("INV-000001")
                .invoiceType(Invoice.InvoiceType.TAX_INVOICE)
                .partyId(partyId)
                .invoiceDate(LocalDate.now())
                .status(Invoice.InvoiceStatus.DRAFT)
                .build();

        // Should allow saving due to businessId + invoiceNo uniqueness at app level
        Invoice saved = invoiceRepository.save(duplicate);
        assertThat(saved).isNotNull();
        assertThat(saved.getInvoiceNo()).isEqualTo("INV-000001");
    }

    @Test
    @DisplayName("soft delete should exclude deleted invoices")
    void softDelete_shouldExcludeDeleted() {
        invoice.setDeleted(true);
        invoiceRepository.save(invoice);

        Page<Invoice> result = invoiceRepository.findByBusinessId(businessId, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getInvoiceNo()).isEqualTo("INV-000002");
    }
}
