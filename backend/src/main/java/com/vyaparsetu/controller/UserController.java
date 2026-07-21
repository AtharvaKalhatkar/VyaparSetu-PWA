package com.vyaparsetu.controller;

import com.vyaparsetu.common.ApiResponse;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.dto.user.DeviceDto;
import com.vyaparsetu.dto.user.UserCreateRequest;
import com.vyaparsetu.dto.user.UserDto;
import com.vyaparsetu.dto.user.UserUpdateRequest;
import com.vyaparsetu.security.SecurityUtils;
import com.vyaparsetu.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<UserDto>>> getUsersByBusiness(
            @PageableDefault(size = 20) Pageable pageable) {
        UUID businessId = SecurityUtils.getCurrentUserBusinessId();
        PagedResponse<UserDto> users = userService.getUsersByBusiness(businessId, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserDto>> getUser(@PathVariable UUID userId) {
        UUID businessId = SecurityUtils.getCurrentUserBusinessId();
        UserDto user = userService.getUserById(businessId, userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> createUser(@Valid @RequestBody UserCreateRequest request) {
        UUID businessId = SecurityUtils.getCurrentUserBusinessId();
        UserDto user = userService.createUser(businessId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("User created", user));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(@PathVariable UUID userId,
                                                            @Valid @RequestBody UserUpdateRequest request) {
        UUID businessId = SecurityUtils.getCurrentUserBusinessId();
        UserDto user = userService.updateUser(businessId, userId, request);
        return ResponseEntity.ok(ApiResponse.success("User updated", user));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID userId) {
        UUID businessId = SecurityUtils.getCurrentUserBusinessId();
        userService.deleteUser(businessId, userId);
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }

    @PutMapping("/{userId}/roles")
    public ResponseEntity<ApiResponse<Void>> assignRole(@PathVariable UUID userId,
                                                         @RequestBody List<UUID> roleIds) {
        UUID businessId = SecurityUtils.getCurrentUserBusinessId();
        userService.assignRole(businessId, userId, roleIds);
        return ResponseEntity.ok(ApiResponse.success("Roles assigned", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser() {
        UUID userId = SecurityUtils.getCurrentUserId();
        UserDto user = userService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PagedResponse<UserDto>>> searchUsers(@RequestParam String query,
                                                                             @PageableDefault(size = 20) Pageable pageable) {
        UUID businessId = SecurityUtils.getCurrentUserBusinessId();
        PagedResponse<UserDto> users = userService.searchUsers(businessId, query, pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{userId}/devices")
    public ResponseEntity<ApiResponse<List<DeviceDto>>> getUserDevices(@PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(java.util.Collections.emptyList()));
    }
}
