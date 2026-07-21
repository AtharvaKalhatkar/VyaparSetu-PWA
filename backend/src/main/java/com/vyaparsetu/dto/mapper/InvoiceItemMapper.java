package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.invoice.InvoiceItemDto;
import com.vyaparsetu.entity.invoice.InvoiceItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InvoiceItemMapper {

    @Mapping(target = "itemName", expression = "java(item.getItem() != null ? item.getItem().getName() : null)")
    @Mapping(target = "itemSku", expression = "java(item.getItem() != null ? item.getItem().getSku() : null)")
    InvoiceItemDto toDto(InvoiceItem item);

    List<InvoiceItemDto> toDtoList(List<InvoiceItem> items);
}
