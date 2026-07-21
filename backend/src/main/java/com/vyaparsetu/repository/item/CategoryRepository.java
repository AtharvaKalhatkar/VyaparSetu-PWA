package com.vyaparsetu.repository.item;

import com.vyaparsetu.entity.item.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID>, JpaSpecificationExecutor<Category> {

    Page<Category> findByBusinessId(UUID businessId, Pageable pageable);

    List<Category> findByBusinessIdAndIsActiveTrue(UUID businessId);

    Optional<Category> findByBusinessIdAndName(UUID businessId, String name);

    List<Category> findByBusinessIdAndParentId(UUID businessId, UUID parentId);
}
