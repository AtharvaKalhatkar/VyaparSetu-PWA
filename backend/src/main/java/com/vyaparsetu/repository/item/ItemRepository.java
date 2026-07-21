package com.vyaparsetu.repository.item;

import com.vyaparsetu.entity.item.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ItemRepository extends JpaRepository<Item, UUID>, JpaSpecificationExecutor<Item> {

    Page<Item> findByBusinessId(UUID businessId, Pageable pageable);

    List<Item> findByBusinessIdAndIsActiveTrue(UUID businessId);

    Optional<Item> findByBusinessIdAndSku(UUID businessId, String sku);

    Optional<Item> findByBusinessIdAndBarcode(UUID businessId, String barcode);

    Page<Item> findByBusinessIdAndCategoryId(UUID businessId, UUID categoryId, Pageable pageable);

    @Query("SELECT i FROM Item i WHERE i.businessId = :businessId AND " +
           "(LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "i.sku LIKE CONCAT('%', :search, '%') OR " +
           "i.barcode LIKE CONCAT('%', :search, '%') OR " +
           "i.hsnCode LIKE CONCAT('%', :search, '%'))")
    Page<Item> searchItems(@Param("businessId") UUID businessId,
                           @Param("search") String search,
                           Pageable pageable);

    List<Item> findByBusinessIdAndCurrentStockLessThanEqual(UUID businessId, java.math.BigDecimal stockLevel);
}
