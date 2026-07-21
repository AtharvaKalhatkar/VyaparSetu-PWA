package com.vyaparsetu.repository.item;

import com.vyaparsetu.entity.item.Brand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BrandRepository extends JpaRepository<Brand, UUID>, JpaSpecificationExecutor<Brand> {

    Page<Brand> findByBusinessId(UUID businessId, Pageable pageable);

    List<Brand> findByBusinessIdAndIsActiveTrue(UUID businessId);

    Optional<Brand> findByBusinessIdAndName(UUID businessId, String name);
}
