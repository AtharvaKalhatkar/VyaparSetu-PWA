package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.party.PartyDto;
import com.vyaparsetu.dto.party.PartyCreateRequest;
import com.vyaparsetu.entity.party.Party;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PartyMapper {

    @Mapping(target = "type", expression = "java(party.getType() != null ? party.getType().name() : null)")
    @Mapping(target = "balanceType", expression = "java(party.getBalanceType() != null ? party.getBalanceType().name() : null)")
    @Mapping(target = "priceCategory", expression = "java(party.getPriceCategory() != null ? party.getPriceCategory().name() : null)")
    PartyDto toDto(Party party);

    @Mapping(target = "type", expression = "java(request.getType() != null ? com.vyaparsetu.entity.party.Party.PartyType.valueOf(request.getType()) : null)")
    @Mapping(target = "balanceType", expression = "java(request.getBalanceType() != null ? com.vyaparsetu.entity.party.Party.BalanceType.valueOf(request.getBalanceType()) : null)")
    @Mapping(target = "priceCategory", expression = "java(request.getPriceCategory() != null ? com.vyaparsetu.entity.party.Party.PriceCategory.valueOf(request.getPriceCategory()) : null)")
    Party toEntity(PartyCreateRequest request);

    List<PartyDto> toDtoList(List<Party> parties);

    default String map(Object value) {
        return value != null ? value.toString() : null;
    }
}
