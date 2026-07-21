package com.vyaparsetu.dto.party;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartyUpdateRequest {
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
    private String type;
    private String partyType;
    private BigDecimal openingBalance;
    private String balanceType;
    private BigDecimal creditLimit;
    private Integer creditDays;
    private String priceCategory;
    private String notes;
    private String tags;
    private String photoUrl;
    private Object customFields;
}
