package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.dto.inventory.InventoryDto;
import com.vyaparsetu.dto.inventory.StockAuditRequest;
import com.vyaparsetu.dto.inventory.StockMovementDto;
import com.vyaparsetu.dto.inventory.StockMovementRequest;
import com.vyaparsetu.dto.inventory.StockTransferRequest;
import com.vyaparsetu.service.inventory.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/inventory")
@RequiredArgsConstructor
@Slf4j
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryDto>>> getInventory(
            @PathVariable UUID businessId,
            @RequestParam(required = false) UUID itemId,
            @RequestParam(required = false) UUID warehouseId) {
        List<InventoryDto> inventory;
        if (itemId != null) {
            inventory = inventoryService.getInventoryByItem(businessId, itemId);
        } else if (warehouseId != null) {
            inventory = inventoryService.getInventoryByWarehouse(businessId, warehouseId);
        } else {
            List<InventoryDto> allInventory = new java.util.ArrayList<>();
            var warehouses = inventoryService.getInventoryByWarehouse(businessId, null);
            allInventory.addAll(warehouses != null ? warehouses : java.util.Collections.emptyList());
            inventory = allInventory;
        }
        return ResponseEntity.ok(ApiResponse.success(inventory));
    }

    @GetMapping("/{inventoryId}")
    public ResponseEntity<ApiResponse<InventoryDto>> getInventoryById(@PathVariable UUID businessId,
                                                                       @PathVariable UUID inventoryId) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PostMapping("/stock/in")
    public ResponseEntity<ApiResponse<StockMovementDto>> addStock(@PathVariable UUID businessId,
                                                                   @Valid @RequestBody StockMovementRequest request) {
        StockMovementDto movement = inventoryService.addStock(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Stock added", movement));
    }

    @PostMapping("/stock/out")
    public ResponseEntity<ApiResponse<StockMovementDto>> removeStock(@PathVariable UUID businessId,
                                                                      @Valid @RequestBody StockMovementRequest request) {
        StockMovementDto movement = inventoryService.removeStock(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Stock removed", movement));
    }

    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<Void>> transferStock(@PathVariable UUID businessId,
                                                            @Valid @RequestBody StockTransferRequest request) {
        inventoryService.transferStock(businessId, request);
        return ResponseEntity.ok(ApiResponse.success("Stock transferred", null));
    }

    @GetMapping("/movements")
    public ResponseEntity<ApiResponse<Page<StockMovementDto>>> getStockMovements(
            @PathVariable UUID businessId,
            @RequestParam(required = false) UUID itemId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<StockMovementDto> movements = inventoryService.getStockMovements(businessId, itemId, pageable);
        return ResponseEntity.ok(ApiResponse.success(movements));
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<ApiResponse<List<InventoryDto>>> getInventoryByWarehouse(
            @PathVariable UUID businessId,
            @PathVariable UUID warehouseId) {
        List<InventoryDto> inventory = inventoryService.getInventoryByWarehouse(businessId, warehouseId);
        return ResponseEntity.ok(ApiResponse.success(inventory));
    }

    @PostMapping("/audit")
    public ResponseEntity<ApiResponse<Void>> performStockAudit(@PathVariable UUID businessId,
                                                                @Valid @RequestBody StockAuditRequest request) {
        inventoryService.performStockAudit(businessId, request);
        return ResponseEntity.ok(ApiResponse.success("Stock audit completed", null));
    }
}
