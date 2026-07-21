package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.crm.CrmLeadDto;
import com.vyaparsetu.dto.crm.CrmLeadCreateRequest;
import com.vyaparsetu.entity.crm.CrmLead;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CrmLeadMapper {

    @Mapping(target = "leadSource", expression = "java(lead.getLeadSource() != null ? lead.getLeadSource().name() : null)")
    @Mapping(target = "status", expression = "java(lead.getStatus() != null ? lead.getStatus().name() : null)")
    @Mapping(target = "priority", expression = "java(lead.getPriority() != null ? lead.getPriority().name() : null)")
    @Mapping(target = "assignedTo", source = "assignedToId")
    CrmLeadDto toDto(CrmLead lead);

    @Mapping(target = "leadSource", expression = "java(request.getLeadSource() != null ? com.vyaparsetu.entity.crm.CrmLead.LeadSource.valueOf(request.getLeadSource()) : null)")
    @Mapping(target = "status", expression = "java(request.getStatus() != null ? com.vyaparsetu.entity.crm.CrmLead.LeadStatus.valueOf(request.getStatus()) : null)")
    @Mapping(target = "priority", expression = "java(request.getPriority() != null ? com.vyaparsetu.entity.crm.CrmLead.LeadPriority.valueOf(request.getPriority()) : null)")
    @Mapping(target = "assignedToId", source = "assignedToId")
    CrmLead toEntity(CrmLeadCreateRequest request);

    List<CrmLeadDto> toDtoList(List<CrmLead> leads);

    default String map(Object value) {
        return value != null ? value.toString() : null;
    }
}
