package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.item.UnitDto;
import com.vyaparsetu.entity.item.Unit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UnitMapper {

    @Mapping(target = "unitType", expression = "java(unit.getUnitType() != null ? unit.getUnitType().name() : null)")
    UnitDto toDto(Unit unit);

    List<UnitDto> toDtoList(List<Unit> units);
}
