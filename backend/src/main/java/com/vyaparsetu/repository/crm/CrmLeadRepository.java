package com.vyaparsetu.repository.crm;

import com.vyaparsetu.entity.crm.CrmLead;
import com.vyaparsetu.entity.crm.CrmLead.LeadStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface CrmLeadRepository extends JpaRepository<CrmLead, UUID>, JpaSpecificationExecutor<CrmLead> {

    Page<CrmLead> findByBusinessId(UUID businessId, Pageable pageable);

    List<CrmLead> findByBusinessIdAndIsActiveTrue(UUID businessId);

    Page<CrmLead> findByBusinessIdAndStatus(UUID businessId, LeadStatus status, Pageable pageable);

    Page<CrmLead> findByBusinessIdAndAssignedToId(UUID businessId, UUID assignedToId, Pageable pageable);

    long countByBusinessIdAndStatus(UUID businessId, LeadStatus status);
}
