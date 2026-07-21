package com.vyaparsetu.dto.gst;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GstReturnDto {
    private String period;
    private String gstrType;
    private Map<String, Object> summary;
}
