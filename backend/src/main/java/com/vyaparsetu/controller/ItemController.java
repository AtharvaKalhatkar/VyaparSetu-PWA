package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.dto.item.ItemCreateRequest;
import com.vyaparsetu.dto.item.ItemDto;
import com.vyaparsetu.dto.item.ItemUpdateRequest;
import com.vyaparsetu.service.item.ItemService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/items")
@RequiredArgsConstructor
@Slf4j
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ItemDto>>> getItems(
            @PathVariable UUID businessId,
            @RequestParam(required = false) String categoryId,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<ItemDto> items = itemService.getItemsByBusiness(businessId, categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemDto>> getItemById(@PathVariable UUID businessId,
                                                             @PathVariable UUID itemId) {
        ItemDto item = itemService.getItemById(businessId, itemId);
        return ResponseEntity.ok(ApiResponse.success(item));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ItemDto>> createItem(@PathVariable UUID businessId,
                                                            @Valid @RequestBody ItemCreateRequest request) {
        ItemDto item = itemService.createItem(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Item created", item));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<ApiResponse<ItemDto>> updateItem(@PathVariable UUID businessId,
                                                            @PathVariable UUID itemId,
                                                            @Valid @RequestBody ItemUpdateRequest request) {
        ItemDto item = itemService.updateItem(businessId, itemId, request);
        return ResponseEntity.ok(ApiResponse.success("Item updated", item));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable UUID businessId,
                                                        @PathVariable UUID itemId) {
        itemService.deleteItem(businessId, itemId);
        return ResponseEntity.ok(ApiResponse.success("Item deleted", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PagedResponse<ItemDto>>> searchItems(
            @PathVariable UUID businessId,
            @RequestParam String query,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<ItemDto> items = itemService.searchItems(businessId, query, pageable);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<ItemDto>>> getLowStockItems(@PathVariable UUID businessId) {
        List<ItemDto> items = itemService.getLowStockItems(businessId);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<ApiResponse<ItemDto>> findByBarcode(@PathVariable UUID businessId,
                                                               @PathVariable String barcode) {
        ItemDto item = itemService.findByBarcode(businessId, barcode);
        return ResponseEntity.ok(ApiResponse.success(item));
    }
}
