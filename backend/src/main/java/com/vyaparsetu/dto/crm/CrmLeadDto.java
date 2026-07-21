package com.vyaparsetu.dto.crm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrmLeadDto {
    private UUID id;
    private UUID partyId;
    private String companyName;
    private String contactPerson;
    private String phone;
    private String email;
    private String leadSource;
    private String status;
    private String priority;
    private UUID assignedTo;
    private String assignedToName;
    private BigDecimal expectedValue;
    private Integer probability;
    private String notes;
    private Object customFields;
    private Instant convertedAt;
    private Instant createdAt;
}
