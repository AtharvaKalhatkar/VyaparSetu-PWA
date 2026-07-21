package com.vyaparsetu.config;

import com.vyaparsetu.security.CustomUserDetails;
import com.vyaparsetu.security.JwtTokenProvider;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@TestConfiguration
public class TestSecurityConfig {

    private static final String TEST_SECRET = "dGVzdC1zZWNyZXQta2V5LWZvci12eWFwYXItc2V0dS1wbGF0Zm9ybS10ZXN0aW5nLXB1cnBvc2VzLW9ubHk=";
    private static final long ACCESS_TOKEN_EXPIRATION = 86400000L;
    private static final long REFRESH_TOKEN_EXPIRATION = 2592000000L;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes = Base64.getDecoder().decode(TEST_SECRET);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    @Bean
    @Primary
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }

    @Bean
    @Primary
    public JwtTokenProvider jwtTokenProvider() {
        return new JwtTokenProvider();
    }

    @Bean
    @Primary
    public UserDetailsService userDetailsService() {
        return username -> {
            CustomUserDetails user = new CustomUserDetails();
            user.setId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
            user.setEmail("test@vyaparsetu.com");
            user.setPhone("9876543210");
            user.setPassword("password");
            user.setRoles(List.of("ROLE_OWNER"));
            user.setBusinessId(UUID.fromString("00000000-0000-0000-0000-000000000002"));
            user.setEnabled(true);
            user.setAccountNonExpired(true);
            user.setAccountNonLocked(true);
            user.setCredentialsNonExpired(true);
            return user;
        };
    }

    public String generateTestToken(String subject, List<String> roles, UUID businessId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + ACCESS_TOKEN_EXPIRATION);
        return Jwts.builder()
                .subject(subject)
                .claim("roles", roles)
                .claim("businessId", businessId != null ? businessId.toString() : null)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }
}
