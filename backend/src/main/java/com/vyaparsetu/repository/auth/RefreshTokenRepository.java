package com.vyaparsetu.repository.auth;

import com.vyaparsetu.entity.auth.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID>, JpaSpecificationExecutor<RefreshToken> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByUserId(UUID userId);

    void deleteByUserIdAndBusinessId(UUID userId, UUID businessId);
}
