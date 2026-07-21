package com.vyaparsetu.repository.party;

import com.vyaparsetu.entity.party.PartyDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface PartyDocumentRepository extends JpaRepository<PartyDocument, UUID>, JpaSpecificationExecutor<PartyDocument> {

    List<PartyDocument> findByPartyId(UUID partyId);

    List<PartyDocument> findByBusinessIdAndPartyId(UUID businessId, UUID partyId);
}
