package com.vyaparsetu.dto.business;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessConfigDto {
    private String industryPack;
    private List<Map<String, Object>> customFields;
    private List<String> enabledModules;
    private Map<String, Object> taxSettings;
}
