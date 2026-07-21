package com.vyaparsetu.service;

import com.vyaparsetu.common.*;
import com.vyaparsetu.dto.auth.*;
import com.vyaparsetu.dto.business.BusinessDto;
import com.vyaparsetu.dto.mapper.BusinessMapper;
import com.vyaparsetu.dto.mapper.UserMapper;
import com.vyaparsetu.dto.user.UserDto;
import com.vyaparsetu.entity.auth.RefreshToken;
import com.vyaparsetu.entity.business.Business;
import com.vyaparsetu.entity.business.BusinessUser;
import com.vyaparsetu.entity.user.Role;
import com.vyaparsetu.entity.user.User;
import com.vyaparsetu.repository.auth.RefreshTokenRepository;
import com.vyaparsetu.repository.business.BusinessRepository;
import com.vyaparsetu.repository.business.BusinessUserRepository;
import com.vyaparsetu.repository.user.RoleRepository;
import com.vyaparsetu.repository.user.UserRepository;
import com.vyaparsetu.security.CustomUserDetails;
import com.vyaparsetu.security.CustomUserDetailsService;
import com.vyaparsetu.security.JwtTokenProvider;
import com.vyaparsetu.service.auth.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private BusinessRepository businessRepository;
    @Mock
    private BusinessUserRepository businessUserRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UserMapper userMapper;
    @Mock
    private BusinessMapper businessMapper;
    @Mock
    private CustomUserDetailsService customUserDetailsService;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthService authService;

    private UUID userId;
    private UUID businessId;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private RefreshTokenRequest refreshTokenRequest;
    private User user;
    private Business business;
    private Role ownerRole;
    private CustomUserDetails userDetails;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        businessId = UUID.randomUUID();

        registerRequest = RegisterRequest.builder()
                .email("test@vyaparsetu.com")
                .phone("9876543210")
                .fullName("Test User")
                .password("password123")
                .businessName("Test Business")
                .build();

        loginRequest = LoginRequest.builder()
                .email("test@vyaparsetu.com")
                .password("password123")
                .build();

        refreshTokenRequest = RefreshTokenRequest.builder()
                .refreshToken("valid-refresh-token")
                .build();

        ownerRole = Role.builder()
                .id(UUID.randomUUID())
                .name(Role.RoleName.OWNER)
                .build();

        user = User.builder()
                .id(userId)
                .email("test@vyaparsetu.com")
                .phone("9876543210")
                .fullName("Test User")
                .password("encoded-password")
                .isActive(true)
                .build();

        business = Business.builder()
                .id(businessId)
                .name("Test Business")
                .businessType("RETAIL")
                .isActive(true)
                .build();

        userDetails = CustomUserDetails.builder()
                .id(userId)
                .email("test@vyaparsetu.com")
                .phone("9876543210")
                .password("encoded-password")
                .roles(List.of("ROLE_OWNER"))
                .businessId(businessId)
                .enabled(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .build();
    }

    @Test
    @DisplayName("register should create user and business and return AuthResponse")
    void register_shouldReturnAuthResponse() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(roleRepository.findByName(Role.RoleName.OWNER)).thenReturn(Optional.of(ownerRole));
        when(businessRepository.save(any(Business.class))).thenReturn(business);
        when(businessUserRepository.save(any(BusinessUser.class))).thenReturn(mock(BusinessUser.class));
        when(jwtTokenProvider.generateAccessToken(anyString(), anyList(), any(), anyString()))
                .thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(anyString())).thenReturn("refresh-token");
        when(jwtTokenProvider.getAccessTokenExpiration()).thenReturn(86400000L);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(mock(RefreshToken.class));
        when(userMapper.toDto(any(User.class))).thenReturn(mock(UserDto.class));
        when(businessMapper.toDto(any(Business.class))).thenReturn(mock(BusinessDto.class));
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        AuthResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");

        verify(userRepository).save(any(User.class));
        verify(businessRepository).save(any(Business.class));
        verify(businessUserRepository).save(any(BusinessUser.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("register should throw DuplicateResourceException when email exists")
    void register_shouldThrowException_whenEmailExists() {
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("email");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("register should throw DuplicateResourceException when phone exists")
    void register_shouldThrowException_whenPhoneExists() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("phone");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("login should authenticate and return AuthResponse")
    void login_shouldReturnAuthResponse() {
        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(jwtTokenProvider.generateAccessToken(anyString(), anyList(), any(), anyString()))
                .thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(anyString())).thenReturn("refresh-token");
        when(jwtTokenProvider.getAccessTokenExpiration()).thenReturn(86400000L);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(mock(RefreshToken.class));
        when(userMapper.toDto(any(User.class))).thenReturn(mock(UserDto.class));
        when(businessMapper.toDto(any(Business.class))).thenReturn(mock(BusinessDto.class));
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        AuthResponse response = authService.login(loginRequest);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("access-token");

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("login should throw UnauthorizedException for bad credentials")
    void login_shouldThrowException_whenInvalidCredentials() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    @DisplayName("refreshToken should return new tokens")
    void refreshToken_shouldReturnNewTokens() {
        when(jwtTokenProvider.validateToken(anyString())).thenReturn(true);
        when(jwtTokenProvider.getUsernameFromToken(anyString())).thenReturn("test@vyaparsetu.com");

        RefreshToken storedToken = RefreshToken.builder()
                .token("encoded-refresh-token")
                .userId(userId)
                .businessId(businessId)
                .expiresAt(Instant.now().plusSeconds(3600))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findAll()).thenReturn(List.of(storedToken));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(customUserDetailsService.loadUserByUsername(anyString())).thenReturn(userDetails);
        when(jwtTokenProvider.generateAccessToken(anyString(), anyList(), any(), any()))
                .thenReturn("new-access-token");
        when(jwtTokenProvider.generateRefreshToken(anyString())).thenReturn("new-refresh-token");
        when(jwtTokenProvider.getAccessTokenExpiration()).thenReturn(86400000L);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenReturn(mock(RefreshToken.class));
        when(userMapper.toDto(any(User.class))).thenReturn(mock(UserDto.class));
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(businessMapper.toDto(any(Business.class))).thenReturn(mock(BusinessDto.class));

        AuthResponse response = authService.refreshToken(refreshTokenRequest);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("new-access-token");
        assertThat(response.getRefreshToken()).isEqualTo("new-refresh-token");

        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("refreshToken should throw UnauthorizedException for invalid token")
    void refreshToken_shouldThrowException_whenInvalidToken() {
        when(jwtTokenProvider.validateToken(anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.refreshToken(refreshTokenRequest))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("refreshToken should throw UnauthorizedException when token not found")
    void refreshToken_shouldThrowException_whenTokenNotFound() {
        when(jwtTokenProvider.validateToken(anyString())).thenReturn(true);
        when(jwtTokenProvider.getUsernameFromToken(anyString())).thenReturn("test@vyaparsetu.com");
        when(refreshTokenRepository.findAll()).thenReturn(List.of());

        assertThatThrownBy(() -> authService.refreshToken(refreshTokenRequest))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("sendOtp should store OTP and log it")
    void sendOtp_shouldStoreOtp() {
        OtpRequest request = OtpRequest.builder().phone("9876543210").build();

        authService.sendOtp(request);

        verifyNoInteractions(userRepository, businessRepository, refreshTokenRepository);
    }

    @Test
    @DisplayName("verifyOtp should return AuthResponse for valid OTP")
    void verifyOtp_shouldReturnAuthResponse() {
        OtpVerifyRequest request = OtpVerifyRequest.builder()
                .phone("9876543210")
                .otp("123456")
                .build();

        authService.sendOtp(OtpRequest.builder().phone("9876543210").build());

        when(userRepository.findByPhone(anyString())).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateAccessToken(anyString(), anyList(), isNull(), anyString()))
                .thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(anyString())).thenReturn("refresh-token");
        when(jwtTokenProvider.getAccessTokenExpiration()).thenReturn(86400000L);
        when(userMapper.toDto(any(User.class))).thenReturn(mock(UserDto.class));

        AuthResponse response = authService.verifyOtp(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("access-token");
    }

    @Test
    @DisplayName("verifyOtp should throw BadRequestException for invalid OTP")
    void verifyOtp_shouldThrowException_whenInvalidOtp() {
        OtpVerifyRequest request = OtpVerifyRequest.builder()
                .phone("9876543210")
                .otp("wrong-otp")
                .build();

        assertThatThrownBy(() -> authService.verifyOtp(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("OTP");
    }

    @Test
    @DisplayName("logout should delete refresh tokens by userId")
    void logout_shouldDeleteTokens() {
        String userIdStr = userId.toString();
        doNothing().when(refreshTokenRepository).deleteByUserId(any(UUID.class));

        authService.logout(userIdStr, null);

        verify(refreshTokenRepository).deleteByUserId(any(UUID.class));
    }
}
