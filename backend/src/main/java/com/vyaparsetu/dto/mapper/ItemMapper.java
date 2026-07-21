package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.item.ItemDto;
import com.vyaparsetu.dto.item.ItemCreateRequest;
import com.vyaparsetu.entity.item.Item;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {CategoryMapper.class, BrandMapper.class, UnitMapper.class})
public interface ItemMapper {

    @Mapping(target = "category", source = "category")
    @Mapping(target = "brand", source = "brand")
    @Mapping(target = "unit", source = "unit")
    @Mapping(target = "taxType", expression = "java(item.getTaxType() != null ? item.getTaxType().name() : null)")
    @Mapping(target = "stockValue", ignore = true)
    ItemDto toDto(Item item);

    @Mapping(target = "taxType", expression = "java(request.getTaxType() != null ? com.vyaparsetu.entity.item.Item.TaxType.valueOf(request.getTaxType()) : null)")
    @Mapping(target = "categoryId", source = "categoryId")
    @Mapping(target = "brandId", source = "brandId")
    @Mapping(target = "unitId", source = "unitId")
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "brand", ignore = true)
    @Mapping(target = "unit", ignore = true)
    Item toEntity(ItemCreateRequest request);

    List<ItemDto> toDtoList(List<Item> items);

    default String map(Object value) {
        return value != null ? value.toString() : null;
    }
}
