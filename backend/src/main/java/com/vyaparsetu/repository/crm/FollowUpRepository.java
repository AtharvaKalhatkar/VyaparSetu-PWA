package com.vyaparsetu.repository.crm;

import com.vyaparsetu.entity.crm.FollowUp;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface FollowUpRepository extends JpaRepository<FollowUp, UUID>, JpaSpecificationExecutor<FollowUp> {

    Page<FollowUp> findByBusinessId(UUID businessId, Pageable pageable);

    List<FollowUp> findByBusinessIdAndLeadId(UUID businessId, UUID leadId);

    List<FollowUp> findByBusinessIdAndPartyId(UUID businessId, UUID partyId);

    List<FollowUp> findByBusinessIdAndFollowUpDate(UUID businessId, LocalDate followUpDate);

    List<FollowUp> findByBusinessIdAndStatus(UUID businessId, FollowUp.FollowUpStatus status);
}
