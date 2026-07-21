package com.vyaparsetu.service.user;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.BadRequestException;
import com.vyaparsetu.common.DuplicateResourceException;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.mapper.UserMapper;
import com.vyaparsetu.dto.user.UserCreateRequest;
import com.vyaparsetu.dto.user.UserDto;
import com.vyaparsetu.dto.user.UserUpdateRequest;
import com.vyaparsetu.entity.business.BusinessUser;
import com.vyaparsetu.entity.user.Role;
import com.vyaparsetu.entity.user.User;
import com.vyaparsetu.repository.business.BusinessUserRepository;
import com.vyaparsetu.repository.user.RoleRepository;
import com.vyaparsetu.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BusinessUserRepository businessUserRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final AuditService auditService;

    @Transactional
    public UserDto createUser(UUID businessId, UserCreateRequest request) {
        log.info("Creating user in business: {}", businessId);

        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new DuplicateResourceException("User", "phone", request.getPhone());
        }

        User user = User.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .fullName(request.getFullName())
                .password(passwordEncoder.encode(request.getPassword()))
                .isActive(true)
                .build();
        user = userRepository.save(user);

        UUID roleId = null;
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            roleId = request.getRoleIds().get(0);
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.getRoleIds()));
            user.setRoles(roles);
            user = userRepository.save(user);
        }

        BusinessUser businessUser = BusinessUser.builder()
                .userId(user.getId())
                .businessId(businessId)
                .roleId(roleId)
                .isActive(true)
                .joinedAt(Instant.now())
                .build();
        businessUserRepository.save(businessUser);

        auditService.logEvent(businessId.toString(), "CREATE_USER", "User", user.getId(),
                null, Map.of("email", user.getEmail(), "businessId", businessId.toString()));

        return userMapper.toDto(user);
    }

    @Transactional
    public UserDto updateUser(UUID businessId, UUID userId, UserUpdateRequest request) {
        log.info("Updating user: {} in business: {}", userId, businessId);

        validateUserAccess(businessId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getDisplayName() != null) user.setDisplayName(request.getDisplayName());
        if (request.getLanguage() != null) user.setLanguage(request.getLanguage());
        if (request.getIsActive() != null) user.setIsActive(request.getIsActive());

        user = userRepository.save(user);

        auditService.logEvent(businessId.toString(), "UPDATE_USER", "User", userId,
                null, Map.of("fullName", user.getFullName()));

        return userMapper.toDto(user);
    }

    @Transactional
    public void deleteUser(UUID businessId, UUID userId) {
        log.info("Deactivating user: {} in business: {}", userId, businessId);

        validateUserAccess(businessId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setIsActive(false);
        userRepository.save(user);

        BusinessUser businessUser = businessUserRepository.findByUserIdAndBusinessId(userId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("BusinessUser"));
        businessUser.setIsActive(false);
        businessUserRepository.save(businessUser);

        auditService.logEvent(businessId.toString(), "DELETE_USER", "User", userId,
                null, Map.of("active", false));
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(UUID businessId, UUID userId) {
        validateUserAccess(businessId, userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return userMapper.toDto(user);
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserDto> getUsersByBusiness(UUID businessId, Pageable pageable) {
        List<User> users = userRepository.findByBusinessesId(businessId);
        List<UserDto> userDtos = userMapper.toDtoList(users);
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), users.size());
        List<UserDto> pageContent = start < users.size() ? userDtos.subList(start, end) : java.util.Collections.emptyList();
        return PagedResponse.of(pageContent, pageable.getPageNumber(), pageable.getPageSize(), users.size());
    }

    @Transactional
    public void assignRole(UUID businessId, UUID userId, List<UUID> roleIds) {
        log.info("Assigning roles to user: {} in business: {}", userId, businessId);

        validateUserAccess(businessId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Set<Role> roles = new HashSet<>(roleRepository.findAllById(roleIds));
        if (roles.isEmpty()) {
            throw new BadRequestException("No valid roles found");
        }

        user.setRoles(roles);
        userRepository.save(user);

        BusinessUser businessUser = businessUserRepository.findByUserIdAndBusinessId(userId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("BusinessUser"));
        businessUser.setRoleId(roleIds.get(0));
        businessUserRepository.save(businessUser);

        auditService.logEvent(businessId.toString(), "ASSIGN_ROLE", "User", userId,
                null, Map.of("roleIds", roleIds.toString()));
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return userMapper.toDto(user);
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserDto> searchUsers(UUID businessId, String query, Pageable pageable) {
        List<User> userList = userRepository.findByBusinessesId(businessId);
        List<User> filtered = userList.stream()
                .filter(u -> u.getFullName().toLowerCase().contains(query.toLowerCase())
                        || (u.getEmail() != null && u.getEmail().toLowerCase().contains(query.toLowerCase()))
                        || (u.getPhone() != null && u.getPhone().contains(query)))
                .toList();
        List<UserDto> userDtos = userMapper.toDtoList(filtered);
        return PagedResponse.of(userDtos, pageable.getPageNumber(), pageable.getPageSize(),
                filtered.size());
    }

    @Transactional(readOnly = true)
    public void validateUserAccess(UUID businessId, UUID userId) {
        boolean exists = businessUserRepository.existsByUserIdAndBusinessId(userId, businessId);
        if (!exists) {
            throw new ResourceNotFoundException("User", userId + " not found in business " + businessId);
        }
    }
}
