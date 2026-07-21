package com.vyaparsetu.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseDto {
    private UUID id;
    private String name;
    private String code;
    private String address;
    private String city;
    private String state;
    private boolean isActive;
    private boolean isPrimary;
}
