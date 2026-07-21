package com.vyaparsetu.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopProductDto {
    private UUID itemId;
    private String itemName;
    private BigDecimal totalQuantity;
    private BigDecimal totalRevenue;
    private int rank;
}
