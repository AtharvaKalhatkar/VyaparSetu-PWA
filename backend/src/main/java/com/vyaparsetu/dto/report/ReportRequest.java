package com.vyaparsetu.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequest {
    private LocalDate startDate;
    private LocalDate endDate;
    private UUID businessId;
    private GroupBy groupBy;
    private String type;

    public enum GroupBy {
        DAY, WEEK, MONTH, YEAR
    }
}
