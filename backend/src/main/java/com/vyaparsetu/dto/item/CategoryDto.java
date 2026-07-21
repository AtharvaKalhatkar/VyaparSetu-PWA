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
public class CategoryDto {
    private UUID id;
    private String name;
    private String description;
    private UUID parentId;
    private String parentName;
    private String imageUrl;
    private Integer sortOrder;
    private boolean isActive;
    private Long itemCount;
}
