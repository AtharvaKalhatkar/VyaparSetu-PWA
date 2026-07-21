package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.dto.item.BrandDto;
import com.vyaparsetu.service.item.BrandService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/brands")
@RequiredArgsConstructor
@Slf4j
public class BrandController {

    private final BrandService brandService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<BrandDto>>> getBrands(
            @PathVariable UUID businessId,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<BrandDto> brands = brandService.getBrandsByBusiness(businessId, pageable);
        return ResponseEntity.ok(ApiResponse.success(brands));
    }

    @GetMapping("/{brandId}")
    public ResponseEntity<ApiResponse<BrandDto>> getBrandById(@PathVariable UUID businessId,
                                                               @PathVariable UUID brandId) {
        BrandDto brand = brandService.getBrandById(businessId, brandId);
        return ResponseEntity.ok(ApiResponse.success(brand));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BrandDto>> createBrand(@PathVariable UUID businessId,
                                                              @Valid @RequestBody BrandDto request) {
        BrandDto brand = brandService.createBrand(businessId, request.getName(), request.getDescription(), request.getImageUrl());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Brand created", brand));
    }

    @PutMapping("/{brandId}")
    public ResponseEntity<ApiResponse<BrandDto>> updateBrand(@PathVariable UUID businessId,
                                                              @PathVariable UUID brandId,
                                                              @Valid @RequestBody BrandDto request) {
        BrandDto brand = brandService.updateBrand(businessId, brandId, request.getName(), request.getDescription(), request.getImageUrl());
        return ResponseEntity.ok(ApiResponse.success("Brand updated", brand));
    }

    @DeleteMapping("/{brandId}")
    public ResponseEntity<ApiResponse<Void>> deleteBrand(@PathVariable UUID businessId,
                                                         @PathVariable UUID brandId) {
        brandService.deleteBrand(businessId, brandId);
        return ResponseEntity.ok(ApiResponse.success("Brand deleted", null));
    }
}
