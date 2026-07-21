package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.dto.business.BusinessConfigDto;
import com.vyaparsetu.dto.business.BusinessDto;
import com.vyaparsetu.dto.business.BusinessSettingsDto;
import com.vyaparsetu.dto.business.BusinessUpdateRequest;
import com.vyaparsetu.dto.user.UserDto;
import com.vyaparsetu.entity.business.FinancialYear;
import com.vyaparsetu.security.SecurityUtils;
import com.vyaparsetu.service.business.BusinessService;
import com.vyaparsetu.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses")
@RequiredArgsConstructor
@Slf4j
public class BusinessController {

    private final BusinessService businessService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BusinessDto>>> getUserBusinesses() {
        UUID userId = SecurityUtils.getCurrentUserId();
        List<BusinessDto> businesses = businessService.getUserBusinesses(userId);
        return ResponseEntity.ok(ApiResponse.success(businesses));
    }

    @GetMapping("/{businessId}")
    @PreAuthorize("hasPermission(#businessId, 'business', 'READ')")
    public ResponseEntity<ApiResponse<BusinessDto>> getBusinessById(@PathVariable UUID businessId) {
        BusinessDto business = businessService.getBusinessById(businessId);
        return ResponseEntity.ok(ApiResponse.success(business));
    }

    @PutMapping("/{businessId}")
    public ResponseEntity<ApiResponse<BusinessDto>> updateBusiness(@PathVariable UUID businessId,
                                                                    @Valid @RequestBody BusinessUpdateRequest request) {
        BusinessDto business = businessService.updateBusiness(businessId, request);
        return ResponseEntity.ok(ApiResponse.success("Business updated", business));
    }

    @PutMapping("/{businessId}/settings")
    public ResponseEntity<ApiResponse<Void>> updateSettings(@PathVariable UUID businessId,
                                                            @Valid @RequestBody BusinessSettingsDto settingsDto) {
        businessService.updateSettings(businessId, settingsDto);
        return ResponseEntity.ok(ApiResponse.success("Settings updated", null));
    }

    @PutMapping("/{businessId}/config")
    public ResponseEntity<ApiResponse<Void>> updateConfig(@PathVariable UUID businessId,
                                                          @Valid @RequestBody BusinessConfigDto configDto) {
        businessService.updateConfig(businessId, configDto);
        return ResponseEntity.ok(ApiResponse.success("Config updated", null));
    }

    @GetMapping("/{businessId}/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getBusinessUsers(@PathVariable UUID businessId) {
        List<UserDto> users = userService.getUsersByBusiness(businessId, org.springframework.data.domain.Pageable.unpaged()).getContent();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{businessId}/financial-years")
    public ResponseEntity<ApiResponse<List<FinancialYear>>> getFinancialYears(@PathVariable UUID businessId) {
        List<FinancialYear> financialYears = businessService.getFinancialYears(businessId);
        return ResponseEntity.ok(ApiResponse.success(financialYears));
    }

    @PostMapping("/{businessId}/financial-years")
    public ResponseEntity<ApiResponse<FinancialYear>> createFinancialYear(@PathVariable UUID businessId,
                                                                           @Valid @RequestBody FinancialYear financialYear) {
        FinancialYear created = businessService.createFinancialYear(businessId, financialYear);
        return ResponseEntity.ok(ApiResponse.success("Financial year created", created));
    }
}
