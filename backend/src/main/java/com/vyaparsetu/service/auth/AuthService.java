package com.vyaparsetu.service.auth;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.BadRequestException;
import com.vyaparsetu.common.DuplicateResourceException;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.common.UnauthorizedException;
import com.vyaparsetu.dto.auth.AuthResponse;
import com.vyaparsetu.dto.auth.ChangePasswordRequest;
import com.vyaparsetu.dto.auth.ForgotPasswordRequest;
import com.vyaparsetu.dto.auth.LoginRequest;
import com.vyaparsetu.dto.auth.OtpRequest;
import com.vyaparsetu.dto.auth.OtpVerifyRequest;
import com.vyaparsetu.dto.auth.RefreshTokenRequest;
import com.vyaparsetu.dto.auth.ResetPasswordRequest;
import com.vyaparsetu.dto.auth.RegisterRequest;
import com.vyaparsetu.dto.business.BusinessDto;
import com.vyaparsetu.dto.mapper.BusinessMapper;
import com.vyaparsetu.dto.mapper.UserMapper;
import com.vyaparsetu.dto.user.UserDto;
import com.vyaparsetu.entity.auth.RefreshToken;
import com.vyaparsetu.entity.business.Business;
import com.vyaparsetu.entity.business.BusinessUser;
import com.vyaparsetu.entity.user.Role;
import com.vyaparsetu.entity.user.Role.RoleName;
import com.vyaparsetu.entity.user.User;
import com.vyaparsetu.repository.auth.RefreshTokenRepository;
import com.vyaparsetu.repository.business.BusinessRepository;
import com.vyaparsetu.repository.business.BusinessUserRepository;
import com.vyaparsetu.repository.user.RoleRepository;
import com.vyaparsetu.repository.user.UserRepository;
import com.vyaparsetu.security.CustomUserDetails;
import com.vyaparsetu.security.CustomUserDetailsService;
import com.vyaparsetu.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final BusinessUserRepository businessUserRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RoleRepository roleRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final BusinessMapper businessMapper;
    private final CustomUserDetailsService customUserDetailsService;
    private final AuditService auditService;

    private static final Map<String, String> OTP_STORE = new HashMap<>();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user with phone: {}", request.getPhone());

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

        Role ownerRole = roleRepository.findByName(RoleName.OWNER)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "OWNER"));

        Business business = Business.builder()
                .name(request.getBusinessName())
                .businessType(request.getBusinessType() != null ? request.getBusinessType() : "RETAIL")
                .isActive(true)
                .build();
        business = businessRepository.save(business);

        BusinessUser businessUser = BusinessUser.builder()
                .userId(user.getId())
                .businessId(business.getId())
                .roleId(ownerRole.getId())
                .isActive(true)
                .joinedAt(Instant.now())
                .build();
        businessUserRepository.save(businessUser);

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getEmail() != null ? user.getEmail() : user.getPhone(),
                Set.of(ownerRole).stream().map(r -> "ROLE_" + r.getName().name()).toList(),
                business.getId(),
                request.getDeviceId());
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken(
                user.getEmail() != null ? user.getEmail() : user.getPhone());

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .token(passwordEncoder.encode(refreshTokenValue))
                .userId(user.getId())
                .businessId(business.getId())
                .expiresAt(Instant.now().plusMillis(jwtTokenProvider.getAccessTokenExpiration() * 2))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        UserDto userDto = userMapper.toDto(user);
        BusinessDto businessDto = businessMapper.toDto(business);

        auditService.logEvent(user.getId().toString(), "REGISTER", "User", user.getId(), null, Map.of("email", user.getEmail()));

        log.info("User registered successfully: {}", user.getId());
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .expiresIn(jwtTokenProvider.getAccessTokenExpiration())
                .user(userDto)
                .business(businessDto)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email/phone: {}", request.getEmail() != null ? request.getEmail() : request.getPhone());

        String principal = request.getEmail() != null ? request.getEmail() : request.getPhone();
        String password = request.getPassword();

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(principal, password));
        } catch (BadCredentialsException e) {
            throw new UnauthorizedException("Invalid credentials");
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", userDetails.getId()));

        UUID businessId = userDetails.getBusinessId();
        Business business = null;
        if (businessId != null) {
            business = businessRepository.findById(businessId)
                    .orElse(null);
        }

        String accessToken = jwtTokenProvider.generateAccessToken(
                userDetails.getUsername(), userDetails.getRoles(),
                businessId, request.getDeviceId());
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken(userDetails.getUsername());

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .token(passwordEncoder.encode(refreshTokenValue))
                .userId(user.getId())
                .businessId(businessId)
                .expiresAt(Instant.now().plusMillis(jwtTokenProvider.getAccessTokenExpiration() * 2))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        UserDto userDto = userMapper.toDto(user);
        BusinessDto businessDto = business != null ? businessMapper.toDto(business) : null;

        auditService.logEvent(user.getId().toString(), "LOGIN", "User", user.getId(), null, null);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .expiresIn(jwtTokenProvider.getAccessTokenExpiration())
                .user(userDto)
                .business(businessDto)
                .build();
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        log.info("Refreshing token");

        String refreshTokenValue = request.getRefreshToken();
        if (!jwtTokenProvider.validateToken(refreshTokenValue)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String username = jwtTokenProvider.getUsernameFromToken(refreshTokenValue);

        Optional<RefreshToken> storedToken = refreshTokenRepository.findAll().stream()
                .filter(rt -> !rt.isRevoked() && rt.getExpiresAt().isAfter(Instant.now()))
                .filter(rt -> passwordEncoder.matches(refreshTokenValue, rt.getToken()))
                .findFirst();

        if (storedToken.isEmpty()) {
            throw new UnauthorizedException("Refresh token not found or revoked");
        }

        RefreshToken tokenEntity = storedToken.get();
        tokenEntity.setRevoked(true);
        refreshTokenRepository.save(tokenEntity);

        User user = userRepository.findById(tokenEntity.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", tokenEntity.getUserId()));

        CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserByUsername(username);

        String newAccessToken = jwtTokenProvider.generateAccessToken(
                username, userDetails.getRoles(),
                tokenEntity.getBusinessId(), null);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(username);

        RefreshToken newTokenEntity = RefreshToken.builder()
                .token(passwordEncoder.encode(newRefreshToken))
                .userId(user.getId())
                .businessId(tokenEntity.getBusinessId())
                .expiresAt(Instant.now().plusMillis(jwtTokenProvider.getAccessTokenExpiration() * 2))
                .revoked(false)
                .build();
        refreshTokenRepository.save(newTokenEntity);

        UserDto userDto = userMapper.toDto(user);
        Business business = tokenEntity.getBusinessId() != null ?
                businessRepository.findById(tokenEntity.getBusinessId()).orElse(null) : null;
        BusinessDto businessDto = business != null ? businessMapper.toDto(business) : null;

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(jwtTokenProvider.getAccessTokenExpiration())
                .user(userDto)
                .business(businessDto)
                .build();
    }

    public void sendOtp(OtpRequest request) {
        log.info("Sending OTP to phone: {}", request.getPhone());
        String otp = String.format("%06d", (int) (Math.random() * 1000000));
        OTP_STORE.put(request.getPhone(), otp);
        log.info("OTP for {}: {} (mock - would send via SMS)", request.getPhone(), otp);
    }

    @Transactional
    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        log.info("Verifying OTP for phone: {}", request.getPhone());

        String storedOtp = OTP_STORE.get(request.getPhone());
        if (storedOtp == null || !storedOtp.equals(request.getOtp())) {
            throw new BadRequestException("Invalid or expired OTP");
        }
        OTP_STORE.remove(request.getPhone());

        Optional<User> existingUser = userRepository.findByPhone(request.getPhone());
        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            user = User.builder()
                    .phone(request.getPhone())
                    .fullName("User")
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .isActive(true)
                    .isPhoneVerified(true)
                    .build();
            user = userRepository.save(user);
        }

        String principal = user.getEmail() != null ? user.getEmail() : user.getPhone();
        String accessToken = jwtTokenProvider.generateAccessToken(
                principal, java.util.List.of("ROLE_USER"), null, request.getDeviceId());
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken(principal);

        UserDto userDto = userMapper.toDto(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .expiresIn(jwtTokenProvider.getAccessTokenExpiration())
                .user(userDto)
                .build();
    }

    @Transactional
    public void logout(String userId, String deviceId) {
        log.info("Logging out user: {}", userId);
        refreshTokenRepository.deleteByUserId(UUID.fromString(userId));
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        log.info("Password reset requested for: {}", request.getEmail() != null ? request.getEmail() : request.getPhone());
        String identifier = request.getEmail() != null ? request.getEmail() : request.getPhone();
        String otp = String.format("%06d", (int) (Math.random() * 1000000));
        OTP_STORE.put("RESET_" + identifier, otp);
        log.info("Password reset OTP for {}: {} (mock)", identifier, otp);
    }

    public void resetPassword(ResetPasswordRequest request) {
        log.info("Resetting password with token");
        String token = request.getToken();
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Reset token is required");
        }
        String newPassword = request.getNewPassword();
        if (newPassword == null || newPassword.isBlank()) {
            throw new BadRequestException("New password is required");
        }
        log.info("Password reset request processed for token: {}", token);
    }

    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        log.info("Changing password for user: {}", userId);

        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        refreshTokenRepository.deleteByUserId(user.getId());

        auditService.logEvent(userId, "CHANGE_PASSWORD", "User", user.getId(), null, null);
    }
}
