package com.vyaparsetu.dto.gst;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HsnSummaryDto {
    private String hsnCode;
    private String description;
    private BigDecimal totalQuantity;
    private String unit;
    private BigDecimal taxableValue;
    private BigDecimal totalGst;
    private BigDecimal rate;
}
