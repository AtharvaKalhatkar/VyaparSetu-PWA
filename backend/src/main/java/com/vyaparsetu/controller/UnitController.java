package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.dto.item.UnitDto;
import com.vyaparsetu.service.item.UnitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/units")
@RequiredArgsConstructor
@Slf4j
public class UnitController {

    private final UnitService unitService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<UnitDto>>> getUnits(
            @PathVariable UUID businessId,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<UnitDto> units = unitService.getUnitsByBusiness(businessId, pageable);
        return ResponseEntity.ok(ApiResponse.success(units));
    }

    @GetMapping("/{unitId}")
    public ResponseEntity<ApiResponse<UnitDto>> getUnitById(@PathVariable UUID businessId,
                                                             @PathVariable UUID unitId) {
        UnitDto unit = unitService.getUnitById(businessId, unitId);
        return ResponseEntity.ok(ApiResponse.success(unit));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UnitDto>> createUnit(@PathVariable UUID businessId,
                                                            @Valid @RequestBody UnitDto request) {
        UnitDto unit = unitService.createUnit(businessId, request.getName(), request.getShortName(),
                request.getBaseUnitId(), request.getConversionFactor(), request.getUnitType());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Unit created", unit));
    }

    @PutMapping("/{unitId}")
    public ResponseEntity<ApiResponse<UnitDto>> updateUnit(@PathVariable UUID businessId,
                                                            @PathVariable UUID unitId,
                                                            @Valid @RequestBody UnitDto request) {
        UnitDto unit = unitService.updateUnit(businessId, unitId, request.getName(), request.getShortName(),
                request.getBaseUnitId(), request.getConversionFactor(), request.getUnitType());
        return ResponseEntity.ok(ApiResponse.success("Unit updated", unit));
    }

    @DeleteMapping("/{unitId}")
    public ResponseEntity<ApiResponse<Void>> deleteUnit(@PathVariable UUID businessId,
                                                        @PathVariable UUID unitId) {
        unitService.deleteUnit(businessId, unitId);
        return ResponseEntity.ok(ApiResponse.success("Unit deleted", null));
    }
}
