package com.vyaparsetu.repository.item;

import com.vyaparsetu.entity.item.Unit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UnitRepository extends JpaRepository<Unit, UUID>, JpaSpecificationExecutor<Unit> {

    Page<Unit> findByBusinessId(UUID businessId, Pageable pageable);

    List<Unit> findByBusinessIdAndIsActiveTrue(UUID businessId);

    Optional<Unit> findByBusinessIdAndShortName(UUID businessId, String shortName);
}
