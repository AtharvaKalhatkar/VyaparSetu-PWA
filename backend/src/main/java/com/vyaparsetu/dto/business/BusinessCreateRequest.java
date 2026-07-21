package com.vyaparsetu.dto.business;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessCreateRequest {
    @NotBlank
    private String name;
    private String businessType;
    private String gstin;
    private String pan;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String phone;
    private String email;
    private Object config;
}
