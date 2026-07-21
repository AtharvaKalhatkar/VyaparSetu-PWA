package com.vyaparsetu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vyaparsetu.config.TestSecurityConfig;
import com.vyaparsetu.dto.auth.*;
import com.vyaparsetu.dto.business.BusinessDto;
import com.vyaparsetu.dto.user.UserDto;
import com.vyaparsetu.service.auth.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    private AuthResponse authResponse;

    @BeforeEach
    void setUp() {
        UserDto userDto = UserDto.builder()
                .id(UUID.randomUUID())
                .email("test@vyaparsetu.com")
                .phone("9876543210")
                .fullName("Test User")
                .build();

        BusinessDto businessDto = BusinessDto.builder()
                .id(UUID.randomUUID())
                .name("Test Business")
                .build();

        authResponse = AuthResponse.builder()
                .accessToken("test-access-token")
                .refreshToken("test-refresh-token")
                .tokenType("Bearer")
                .expiresIn(86400000L)
                .user(userDto)
                .business(businessDto)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/auth/register should return 201 with AuthResponse")
    void register_shouldReturnCreated() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .phone("9876543210")
                .fullName("Test User")
                .password("password123")
                .businessName("Test Business")
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Registration successful"))
                .andExpect(jsonPath("$.data.accessToken").value("test-access-token"))
                .andExpect(jsonPath("$.data.refreshToken").value("test-refresh-token"));

        verify(authService).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register should return 400 on validation errors")
    void register_shouldReturnBadRequest_whenInvalid() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .phone("")
                .fullName("")
                .password("12")
                .businessName("")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login should return 200 with AuthResponse")
    void login_shouldReturnOk() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("test@vyaparsetu.com")
                .password("password123")
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("test-access-token"));

        verify(authService).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh should return 200 with new tokens")
    void refreshToken_shouldReturnOk() throws Exception {
        RefreshTokenRequest request = RefreshTokenRequest.builder()
                .refreshToken("valid-refresh-token")
                .build();

        when(authService.refreshToken(any(RefreshTokenRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Token refreshed"));

        verify(authService).refreshToken(any(RefreshTokenRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/auth/otp/send should return 200")
    void sendOtp_shouldReturnOk() throws Exception {
        OtpRequest request = OtpRequest.builder()
                .phone("9876543210")
                .build();

        doNothing().when(authService).sendOtp(any(OtpRequest.class));

        mockMvc.perform(post("/api/v1/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("OTP sent successfully"));

        verify(authService).sendOtp(any(OtpRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/auth/otp/send should return 400 when phone is blank")
    void sendOtp_shouldReturnBadRequest_whenPhoneBlank() throws Exception {
        OtpRequest request = OtpRequest.builder()
                .phone("")
                .build();

        mockMvc.perform(post("/api/v1/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(authService, never()).sendOtp(any());
    }

    @Test
    @DisplayName("POST /api/v1/auth/otp/verify should return 200 with AuthResponse")
    void verifyOtp_shouldReturnOk() throws Exception {
        OtpVerifyRequest request = OtpVerifyRequest.builder()
                .phone("9876543210")
                .otp("123456")
                .build();

        when(authService.verifyOtp(any(OtpVerifyRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("OTP verified"));

        verify(authService).verifyOtp(any(OtpVerifyRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout should return 200")
    void logout_shouldReturnOk() throws Exception {
        doNothing().when(authService).logout(anyString(), any());

        mockMvc.perform(post("/api/v1/auth/logout")
                        .param("userId", "00000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Logged out successfully"));

        verify(authService).logout(anyString(), any());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login should return 200 with phone-based login")
    void login_withPhone_shouldReturnOk() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .phone("9876543210")
                .password("password123")
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(authService).login(any(LoginRequest.class));
    }
}
