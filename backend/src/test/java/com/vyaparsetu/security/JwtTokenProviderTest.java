package com.vyaparsetu.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.lang.reflect.Field;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    private static final String TEST_SECRET = "dGVzdC1zZWNyZXQta2V5LWZvci12eWFwYXItc2V0dS1wbGF0Zm9ybS10ZXN0aW5nLXB1cnBvc2VzLW9ubHk=";
    private static final long ACCESS_TOKEN_EXPIRATION = 86400000L;
    private static final long REFRESH_TOKEN_EXPIRATION = 2592000000L;

    private SecretKey secretKey;

    @BeforeEach
    void setUp() throws Exception {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtTokenProvider, "accessTokenExpiration", ACCESS_TOKEN_EXPIRATION);
        ReflectionTestUtils.setField(jwtTokenProvider, "refreshTokenExpiration", REFRESH_TOKEN_EXPIRATION);

        jwtTokenProvider.init();

        byte[] keyBytes = Base64.getDecoder().decode(TEST_SECRET);
        secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    @Test
    @DisplayName("generateAccessToken should create a valid JWT token")
    void generateAccessToken_shouldCreateValidToken() {
        String email = "test@vyaparsetu.com";
        List<String> roles = List.of("ROLE_OWNER");
        UUID businessId = UUID.randomUUID();

        String token = jwtTokenProvider.generateAccessToken(email, roles, businessId, "device-001");

        assertThat(token).isNotNull();
        assertThat(token.split("\\.")).hasSize(3);

        String extractedEmail = jwtTokenProvider.getUsernameFromToken(token);
        assertThat(extractedEmail).isEqualTo(email);

        List<String> extractedRoles = jwtTokenProvider.getRolesFromToken(token);
        assertThat(extractedRoles).containsExactly("ROLE_OWNER");

        UUID extractedBusinessId = jwtTokenProvider.getBusinessIdFromToken(token);
        assertThat(extractedBusinessId).isEqualTo(businessId);

        String deviceId = jwtTokenProvider.getDeviceIdFromToken(token);
        assertThat(deviceId).isEqualTo("device-001");
    }

    @Test
    @DisplayName("generateAccessToken should handle null businessId")
    void generateAccessToken_shouldHandleNullBusinessId() {
        String token = jwtTokenProvider.generateAccessToken("test@test.com", List.of("ROLE_USER"), null, null);

        UUID extractedBusinessId = jwtTokenProvider.getBusinessIdFromToken(token);
        assertThat(extractedBusinessId).isNull();
    }

    @Test
    @DisplayName("generateRefreshToken should create a valid refresh token")
    void generateRefreshToken_shouldCreateValidToken() {
        String email = "test@vyaparsetu.com";
        String token = jwtTokenProvider.generateRefreshToken(email);

        assertThat(token).isNotNull();
        String extractedEmail = jwtTokenProvider.getUsernameFromToken(token);
        assertThat(extractedEmail).isEqualTo(email);
    }

    @Test
    @DisplayName("validateToken should return true for valid token")
    void validateToken_shouldReturnTrue_forValidToken() {
        String token = jwtTokenProvider.generateAccessToken("test@test.com", List.of("ROLE_USER"), null, null);

        boolean isValid = jwtTokenProvider.validateToken(token);

        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("validateToken should return false for expired token")
    void validateToken_shouldReturnFalse_forExpiredToken() {
        Date now = new Date();
        Date expiredDate = new Date(now.getTime() - 1000);

        String expiredToken = Jwts.builder()
                .subject("test@test.com")
                .issuedAt(new Date(now.getTime() - 100000))
                .expiration(expiredDate)
                .signWith(secretKey)
                .compact();

        boolean isValid = jwtTokenProvider.validateToken(expiredToken);

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("validateToken should return false for token with wrong signature")
    void validateToken_shouldReturnFalse_forWrongSignature() {
        byte[] wrongKeyBytes = Base64.getDecoder().decode("d2hvbGx5LWRpZmZlcmVudC1zZWNyZXQta2V5LWZvci10ZXN0aW5nLXB1cnBvc2VzLW9ubHktdG9v");
        SecretKey wrongKey = Keys.hmacShaKeyFor(wrongKeyBytes);

        String tokenWithWrongSignature = Jwts.builder()
                .subject("test@test.com")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(wrongKey)
                .compact();

        boolean isValid = jwtTokenProvider.validateToken(tokenWithWrongSignature);

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("validateToken should return false for malformed token")
    void validateToken_shouldReturnFalse_forMalformedToken() {
        boolean isValid = jwtTokenProvider.validateToken("invalid-token");
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("getRolesFromToken should return empty list when no roles claim")
    void getRolesFromToken_shouldReturnEmptyList_whenNoRoles() {
        String token = Jwts.builder()
                .subject("test@test.com")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(secretKey)
                .compact();

        List<String> roles = jwtTokenProvider.getRolesFromToken(token);
        assertThat(roles).isEmpty();
    }

    @Test
    @DisplayName("getBusinessIdFromToken should return null when no businessId claim")
    void getBusinessIdFromToken_shouldReturnNull_whenNoBusinessId() {
        String token = jwtTokenProvider.generateAccessToken("test@test.com", List.of("ROLE_USER"), null, null);

        UUID businessId = jwtTokenProvider.getBusinessIdFromToken(token);
        assertThat(businessId).isNull();
    }

    @Test
    @DisplayName("Token should contain roles and businessId claims")
    void token_shouldContainRolesAndBusinessId() {
        UUID businessId = UUID.randomUUID();
        List<String> roles = List.of("ROLE_OWNER", "ROLE_ADMIN");

        String token = jwtTokenProvider.generateAccessToken("test@vyaparsetu.com", roles, businessId, null);

        List<String> extractedRoles = jwtTokenProvider.getRolesFromToken(token);
        UUID extractedBusinessId = jwtTokenProvider.getBusinessIdFromToken(token);

        assertThat(extractedRoles).containsExactlyInAnyOrder("ROLE_OWNER", "ROLE_ADMIN");
        assertThat(extractedBusinessId).isEqualTo(businessId);
    }

    @Test
    @DisplayName("getAccessTokenExpiration should return configured value")
    void getAccessTokenExpiration_shouldReturnConfigured() {
        long expiration = jwtTokenProvider.getAccessTokenExpiration();
        assertThat(expiration).isEqualTo(ACCESS_TOKEN_EXPIRATION);
    }
}
