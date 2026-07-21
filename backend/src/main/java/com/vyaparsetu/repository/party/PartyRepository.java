package com.vyaparsetu.repository.party;

import com.vyaparsetu.entity.party.Party;
import com.vyaparsetu.entity.party.Party.PartyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PartyRepository extends JpaRepository<Party, UUID>, JpaSpecificationExecutor<Party> {

    Page<Party> findByBusinessId(UUID businessId, Pageable pageable);

    List<Party> findByBusinessIdAndIsActiveTrue(UUID businessId);

    Page<Party> findByBusinessIdAndType(UUID businessId, PartyType type, Pageable pageable);

    Optional<Party> findByBusinessIdAndPhone(UUID businessId, String phone);

    Optional<Party> findByBusinessIdAndId(UUID businessId, UUID id);

    @Query("SELECT p FROM Party p WHERE p.businessId = :businessId AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "p.phone LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Party> searchByNameOrPhone(@Param("businessId") UUID businessId,
                                    @Param("search") String search,
                                    Pageable pageable);

    long countByBusinessIdAndIsActiveTrue(UUID businessId);
}
