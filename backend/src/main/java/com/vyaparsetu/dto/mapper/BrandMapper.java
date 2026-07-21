package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.item.BrandDto;
import com.vyaparsetu.entity.item.Brand;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BrandMapper {

    BrandDto toDto(Brand brand);

    List<BrandDto> toDtoList(List<Brand> brands);
}
