package com.vyaparsetu.repository.inventory;

import com.vyaparsetu.entity.inventory.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryRepository extends JpaRepository<Inventory, UUID>, JpaSpecificationExecutor<Inventory> {

    List<Inventory> findByBusinessId(UUID businessId);

    List<Inventory> findByBusinessIdAndItemId(UUID businessId, UUID itemId);

    List<Inventory> findByBusinessIdAndWarehouseId(UUID businessId, UUID warehouseId);

    Optional<Inventory> findByBusinessIdAndItemIdAndWarehouseId(UUID businessId, UUID itemId, UUID warehouseId);

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM Inventory i WHERE i.businessId = :businessId AND i.itemId = :itemId")
    BigDecimal getStockByItemId(@Param("businessId") UUID businessId, @Param("itemId") UUID itemId);
}
