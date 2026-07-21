package com.vyaparsetu.repository.invoice;

import com.vyaparsetu.entity.invoice.Invoice;
import com.vyaparsetu.entity.invoice.Invoice.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID>, JpaSpecificationExecutor<Invoice> {

    Page<Invoice> findByBusinessId(UUID businessId, Pageable pageable);

    Optional<Invoice> findByBusinessIdAndInvoiceNo(UUID businessId, String invoiceNo);

    Page<Invoice> findByBusinessIdAndPartyId(UUID businessId, UUID partyId, Pageable pageable);

    Page<Invoice> findByBusinessIdAndStatus(UUID businessId, InvoiceStatus status, Pageable pageable);

    List<Invoice> findByBusinessIdAndInvoiceDateBetween(UUID businessId, LocalDate startDate, LocalDate endDate);

    Page<Invoice> findByBusinessIdAndInvoiceType(UUID businessId, String invoiceType, Pageable pageable);
}
