package com.vyaparsetu.repository.ledger;

import com.vyaparsetu.entity.ledger.LedgerBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LedgerBalanceRepository extends JpaRepository<LedgerBalance, UUID>, JpaSpecificationExecutor<LedgerBalance> {

    List<LedgerBalance> findByBusinessId(UUID businessId);

    Optional<LedgerBalance> findByBusinessIdAndPartyId(UUID businessId, UUID partyId);
}
