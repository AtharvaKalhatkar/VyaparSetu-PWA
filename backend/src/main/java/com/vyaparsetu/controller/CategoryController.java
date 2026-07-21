package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.dto.item.CategoryCreateRequest;
import com.vyaparsetu.dto.item.CategoryDto;
import com.vyaparsetu.dto.item.ItemDto;
import com.vyaparsetu.service.item.CategoryService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/categories")
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;
    private final ItemService itemService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<CategoryDto>>> getCategories(
            @PathVariable UUID businessId,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<CategoryDto> categories = categoryService.getCategoriesByBusiness(businessId, pageable);
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<CategoryDto>> getCategoryById(@PathVariable UUID businessId,
                                                                     @PathVariable UUID categoryId) {
        CategoryDto category = categoryService.getCategoryById(businessId, categoryId);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(@PathVariable UUID businessId,
                                                                    @Valid @RequestBody CategoryCreateRequest request) {
        CategoryDto category = categoryService.createCategory(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Category created", category));
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(@PathVariable UUID businessId,
                                                                    @PathVariable UUID categoryId,
                                                                    @Valid @RequestBody CategoryCreateRequest request) {
        CategoryDto category = categoryService.updateCategory(businessId, categoryId, request);
        return ResponseEntity.ok(ApiResponse.success("Category updated", category));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable UUID businessId,
                                                            @PathVariable UUID categoryId) {
        categoryService.deleteCategory(businessId, categoryId);
        return ResponseEntity.ok(ApiResponse.success("Category deleted", null));
    }

    @GetMapping("/{categoryId}/items")
    public ResponseEntity<ApiResponse<PagedResponse<ItemDto>>> getItemsByCategory(
            @PathVariable UUID businessId,
            @PathVariable UUID categoryId,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<ItemDto> items = itemService.getItemsByBusiness(businessId, categoryId.toString(), pageable);
        return ResponseEntity.ok(ApiResponse.success(items));
    }
}
