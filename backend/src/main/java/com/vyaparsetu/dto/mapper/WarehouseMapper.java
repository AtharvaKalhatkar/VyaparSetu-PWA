package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.inventory.WarehouseDto;
import com.vyaparsetu.entity.inventory.Warehouse;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface WarehouseMapper {

    WarehouseDto toDto(Warehouse warehouse);

    List<WarehouseDto> toDtoList(List<Warehouse> warehouses);
}
