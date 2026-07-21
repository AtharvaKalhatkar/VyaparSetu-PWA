package com.vyaparsetu.dto.item;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandDto {
    private UUID id;
    private String name;
    private String description;
    private String imageUrl;
    private boolean isActive;
    private Long itemCount;
}
