package com.vyaparsetu.repository.inventory;

import com.vyaparsetu.entity.inventory.Warehouse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WarehouseRepository extends JpaRepository<Warehouse, UUID>, JpaSpecificationExecutor<Warehouse> {

    Page<Warehouse> findByBusinessId(UUID businessId, Pageable pageable);

    List<Warehouse> findByBusinessIdAndIsActiveTrue(UUID businessId);

    Optional<Warehouse> findByBusinessIdAndCode(UUID businessId, String code);

    Optional<Warehouse> findByBusinessIdAndIsPrimaryTrue(UUID businessId);
}
