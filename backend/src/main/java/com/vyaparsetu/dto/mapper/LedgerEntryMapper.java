package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.ledger.LedgerEntryDto;
import com.vyaparsetu.entity.ledger.LedgerEntry;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface LedgerEntryMapper {

    @Mapping(target = "partyName", expression = "java(entry.getParty() != null ? entry.getParty().getName() : null)")
    @Mapping(target = "transactionType", expression = "java(entry.getTransactionType() != null ? entry.getTransactionType().name() : null)")
    @Mapping(target = "entryType", expression = "java(entry.getEntryType() != null ? entry.getEntryType().name() : null)")
    @Mapping(target = "mode", expression = "java(entry.getMode() != null ? entry.getMode().name() : null)")
    LedgerEntryDto toDto(LedgerEntry entry);

    List<LedgerEntryDto> toDtoList(List<LedgerEntry> entries);
}
