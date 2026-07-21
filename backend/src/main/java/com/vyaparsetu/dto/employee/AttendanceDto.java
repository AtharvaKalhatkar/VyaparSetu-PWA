package com.vyaparsetu.dto.employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDto {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LocalDate date;
    private Instant checkIn;
    private Instant checkOut;
    private String status;
    private Double gpsLatitude;
    private Double gpsLongitude;
    private String note;
}
