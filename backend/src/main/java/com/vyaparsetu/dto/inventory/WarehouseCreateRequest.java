package com.vyaparsetu.dto.inventory;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseCreateRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String code;
    private String address;
    private String city;
    private String state;
    private Boolean isPrimary;
}
