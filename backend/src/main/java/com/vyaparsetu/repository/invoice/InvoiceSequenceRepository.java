package com.vyaparsetu.repository.invoice;

import com.vyaparsetu.entity.invoice.InvoiceSequence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface InvoiceSequenceRepository extends JpaRepository<InvoiceSequence, UUID>, JpaSpecificationExecutor<InvoiceSequence> {

    Optional<InvoiceSequence> findByBusinessIdAndInvoiceTypeAndFinancialYear(
            UUID businessId, String invoiceType, String financialYear);
}
