package com.vyaparsetu.repository.business;

import com.vyaparsetu.entity.business.FinancialYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FinancialYearRepository extends JpaRepository<FinancialYear, UUID>, JpaSpecificationExecutor<FinancialYear> {

    List<FinancialYear> findByBusinessId(UUID businessId);

    Optional<FinancialYear> findByBusinessIdAndIsCurrentTrue(UUID businessId);

    Optional<FinancialYear> findByBusinessIdAndName(UUID businessId, String name);
}
