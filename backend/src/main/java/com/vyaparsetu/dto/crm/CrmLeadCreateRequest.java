package com.vyaparsetu.dto.crm;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrmLeadCreateRequest {
    @NotBlank
    private String companyName;
    private String contactPerson;
    private String phone;
    private String email;
    private String leadSource;
    private String status;
    private String priority;
    private UUID assignedToId;
    private BigDecimal expectedValue;
    private Integer probability;
    private String notes;
    private Object customFields;
}
