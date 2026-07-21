package com.vyaparsetu.repository.invoice;

import com.vyaparsetu.entity.invoice.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, UUID>, JpaSpecificationExecutor<InvoiceItem> {

    List<InvoiceItem> findByInvoiceId(UUID invoiceId);

    List<InvoiceItem> findByBusinessIdAndInvoiceId(UUID businessId, UUID invoiceId);

    void deleteByInvoiceId(UUID invoiceId);
}
