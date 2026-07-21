package com.vyaparsetu.dto.business;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.MonthDay;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessDto {
    private UUID id;
    private String name;
    private String businessType;
    private String gstin;
    private String pan;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String pincode;
    private String country;
    private String phone;
    private String email;
    private String website;
    private String logo;
    private MonthDay financialYearStart;
    private MonthDay financialYearEnd;
    private boolean isActive;
    private boolean isGstEnabled;
    private Object config;
    private Object settings;
    private Instant createdAt;
}
