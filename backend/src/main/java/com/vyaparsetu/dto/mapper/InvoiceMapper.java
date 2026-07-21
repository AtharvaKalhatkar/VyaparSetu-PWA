package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.invoice.InvoiceDto;
import com.vyaparsetu.dto.invoice.InvoiceCreateRequest;
import com.vyaparsetu.entity.invoice.Invoice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {InvoiceItemMapper.class})
public interface InvoiceMapper {

    @Mapping(target = "invoiceType", expression = "java(invoice.getInvoiceType() != null ? invoice.getInvoiceType().name() : null)")
    @Mapping(target = "status", expression = "java(invoice.getStatus() != null ? invoice.getStatus().name() : null)")
    @Mapping(target = "paymentStatus", expression = "java(invoice.getPaymentStatus() != null ? invoice.getPaymentStatus().name() : null)")
    @Mapping(target = "paymentMode", expression = "java(invoice.getPaymentMode() != null ? invoice.getPaymentMode().name() : null)")
    @Mapping(target = "partyName", expression = "java(invoice.getParty() != null ? invoice.getParty().getName() : null)")
    @Mapping(target = "partyPhone", expression = "java(invoice.getParty() != null ? invoice.getParty().getPhone() : null)")
    @Mapping(target = "items", ignore = true)
    InvoiceDto toDto(Invoice invoice);

    @Mapping(target = "invoiceType", expression = "java(request.getInvoiceType() != null ? com.vyaparsetu.entity.invoice.Invoice.InvoiceType.valueOf(request.getInvoiceType()) : null)")
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "paymentStatus", expression = "java(request.getPaymentStatus() != null ? com.vyaparsetu.entity.invoice.Invoice.PaymentStatus.valueOf(request.getPaymentStatus()) : null)")
    @Mapping(target = "paymentMode", expression = "java(request.getPaymentMode() != null ? com.vyaparsetu.entity.invoice.Invoice.PaymentMode.valueOf(request.getPaymentMode()) : null)")
    @Mapping(target = "party", ignore = true)
    Invoice toEntity(InvoiceCreateRequest request);

    List<InvoiceDto> toDtoList(List<Invoice> invoices);
}
