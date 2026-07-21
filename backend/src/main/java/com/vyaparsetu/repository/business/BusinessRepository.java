package com.vyaparsetu.repository.business;

import com.vyaparsetu.entity.business.Business;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface BusinessRepository extends JpaRepository<Business, UUID>, JpaSpecificationExecutor<Business> {

    Optional<Business> findByGstin(String gstin);

    Optional<Business> findByIdAndIsActiveTrue(UUID id);
}
