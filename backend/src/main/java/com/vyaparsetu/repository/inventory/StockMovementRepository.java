package com.vyaparsetu.repository.inventory;

import com.vyaparsetu.entity.inventory.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID>, JpaSpecificationExecutor<StockMovement> {

    Page<StockMovement> findByBusinessId(UUID businessId, Pageable pageable);

    List<StockMovement> findByBusinessIdAndItemId(UUID businessId, UUID itemId);

    List<StockMovement> findByBusinessIdAndReferenceTypeAndReferenceId(UUID businessId, String referenceType, UUID referenceId);
}
