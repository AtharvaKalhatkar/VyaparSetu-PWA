package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.business.BusinessDto;
import com.vyaparsetu.dto.business.BusinessCreateRequest;
import com.vyaparsetu.entity.business.Business;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BusinessMapper {

    BusinessDto toDto(Business business);

    Business toEntity(BusinessCreateRequest request);

    List<BusinessDto> toDtoList(List<Business> businesses);

    default String map(Object value) {
        return value != null ? value.toString() : null;
    }
}
