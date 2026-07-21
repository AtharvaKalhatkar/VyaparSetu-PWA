package com.vyaparsetu.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardWidgetDto {
    private String widgetId;
    private String widgetType;
    private String title;
    private Object data;
    private int refreshInterval;
}
