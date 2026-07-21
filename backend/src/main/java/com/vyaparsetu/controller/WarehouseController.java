package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.dto.inventory.WarehouseCreateRequest;
import com.vyaparsetu.dto.inventory.WarehouseDto;
import com.vyaparsetu.service.inventory.WarehouseService;
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
@RequestMapping("/api/v1/businesses/{businessId}/warehouses")
@RequiredArgsConstructor
@Slf4j
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<WarehouseDto>>> getWarehouses(
            @PathVariable UUID businessId,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<WarehouseDto> warehouses = warehouseService.getWarehousesByBusiness(businessId, pageable);
        return ResponseEntity.ok(ApiResponse.success(warehouses));
    }

    @GetMapping("/{warehouseId}")
    public ResponseEntity<ApiResponse<WarehouseDto>> getWarehouseById(@PathVariable UUID businessId,
                                                                       @PathVariable UUID warehouseId) {
        WarehouseDto warehouse = warehouseService.getWarehouseById(businessId, warehouseId);
        return ResponseEntity.ok(ApiResponse.success(warehouse));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WarehouseDto>> createWarehouse(@PathVariable UUID businessId,
                                                                      @Valid @RequestBody WarehouseCreateRequest request) {
        WarehouseDto warehouse = warehouseService.createWarehouse(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Warehouse created", warehouse));
    }

    @PutMapping("/{warehouseId}")
    public ResponseEntity<ApiResponse<WarehouseDto>> updateWarehouse(@PathVariable UUID businessId,
                                                                      @PathVariable UUID warehouseId,
                                                                      @Valid @RequestBody WarehouseCreateRequest request) {
        WarehouseDto warehouse = warehouseService.updateWarehouse(businessId, warehouseId, request);
        return ResponseEntity.ok(ApiResponse.success("Warehouse updated", warehouse));
    }

    @DeleteMapping("/{warehouseId}")
    public ResponseEntity<ApiResponse<Void>> deleteWarehouse(@PathVariable UUID businessId,
                                                             @PathVariable UUID warehouseId) {
        warehouseService.deleteWarehouse(businessId, warehouseId);
        return ResponseEntity.ok(ApiResponse.success("Warehouse deleted", null));
    }
}
