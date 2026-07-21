package com.vyaparsetu.dto.party;

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
public class PartyDto {
    private UUID id;
    private String name;
    private String phone;
    private String email;
    private String gstin;
    private String pan;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String pincode;
    private String country;
    private String type;
    private String partyType;
    private BigDecimal openingBalance;
    private String balanceType;
    private BigDecimal creditLimit;
    private Integer creditDays;
    private String priceCategory;
    private String notes;
    private String tags;
    private boolean isActive;
    private Object customFields;
    private String photoUrl;
    private BigDecimal currentBalance;
    private BigDecimal totalDue;
    private BigDecimal totalOverdue;
    private Instant createdAt;
    private Instant updatedAt;
}
