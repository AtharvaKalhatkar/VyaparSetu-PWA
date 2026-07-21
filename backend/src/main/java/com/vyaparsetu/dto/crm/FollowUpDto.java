package com.vyaparsetu.dto.crm;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowUpDto {
    private UUID id;
    private UUID leadId;
    private UUID partyId;
    private LocalDate followUpDate;
    private LocalTime followUpTime;
    private String type;
    private String status;
    private String notes;
    private Instant completedAt;
    private String completedBy;
}
