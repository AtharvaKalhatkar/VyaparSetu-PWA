package com.vyaparsetu.repository.business;

import com.vyaparsetu.entity.business.BusinessUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BusinessUserRepository extends JpaRepository<BusinessUser, UUID>, JpaSpecificationExecutor<BusinessUser> {

    List<BusinessUser> findByBusinessId(UUID businessId);

    List<BusinessUser> findByUserId(UUID userId);

    Optional<BusinessUser> findByUserIdAndBusinessId(UUID userId, UUID businessId);

    List<BusinessUser> findByBusinessIdAndIsActiveTrue(UUID businessId);

    boolean existsByUserIdAndBusinessId(UUID userId, UUID businessId);
}
