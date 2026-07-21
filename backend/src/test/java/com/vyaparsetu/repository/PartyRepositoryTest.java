package com.vyaparsetu.repository;

import com.vyaparsetu.entity.party.Party;
import com.vyaparsetu.repository.party.PartyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class PartyRepositoryTest {

    @Autowired
    private PartyRepository partyRepository;

    private UUID businessId;
    private Party party;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();

        party = Party.builder()
                .businessId(businessId)
                .name("Test Party")
                .phone("9876543210")
                .email("party@test.com")
                .type(Party.PartyType.CUSTOMER)
                .country("India")
                .isActive(true)
                .build();
        party = partyRepository.save(party);
    }

    @Test
    @DisplayName("findByBusinessId should return parties for business")
    void findByBusinessId_shouldReturnParties() {
        Page<Party> result = partyRepository.findByBusinessId(businessId, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Test Party");
    }

    @Test
    @DisplayName("findByBusinessId should return empty for different business")
    void findByBusinessId_shouldReturnEmpty_forDifferentBusiness() {
        Page<Party> result = partyRepository.findByBusinessId(UUID.randomUUID(), PageRequest.of(0, 20));

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    @DisplayName("findByBusinessIdAndType should filter by party type")
    void findByBusinessIdAndType_shouldFilterByType() {
        Page<Party> result = partyRepository.findByBusinessIdAndType(
                businessId, Party.PartyType.CUSTOMER, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);

        Page<Party> supplierResult = partyRepository.findByBusinessIdAndType(
                businessId, Party.PartyType.SUPPLIER, PageRequest.of(0, 20));

        assertThat(supplierResult.getContent()).isEmpty();
    }

    @Test
    @DisplayName("searchByNameOrPhone should find by name")
    void searchByNameOrPhone_shouldFindByName() {
        Page<Party> result = partyRepository.searchByNameOrPhone(
                businessId, "Test", PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);

        Page<Party> noResult = partyRepository.searchByNameOrPhone(
                businessId, "NonExistent", PageRequest.of(0, 20));

        assertThat(noResult.getContent()).isEmpty();
    }

    @Test
    @DisplayName("searchByNameOrPhone should find by phone")
    void searchByNameOrPhone_shouldFindByPhone() {
        Page<Party> result = partyRepository.searchByNameOrPhone(
                businessId, "9876543210", PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("soft delete should exclude deleted parties")
    void softDelete_shouldExcludeDeletedParties() {
        party.setDeleted(true);
        partyRepository.save(party);

        Page<Party> result = partyRepository.findByBusinessId(businessId, PageRequest.of(0, 20));
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    @DisplayName("findByBusinessIdAndPhone should return party by phone")
    void findByBusinessIdAndPhone_shouldReturnParty() {
        Optional<Party> result = partyRepository.findByBusinessIdAndPhone(businessId, "9876543210");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Test Party");
    }

    @Test
    @DisplayName("findByBusinessIdAndPhone should return empty for non-existent phone")
    void findByBusinessIdAndPhone_shouldReturnEmpty_whenNotFound() {
        Optional<Party> result = partyRepository.findByBusinessIdAndPhone(businessId, "0000000000");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findByBusinessIdAndId should return party by id")
    void findByBusinessIdAndId_shouldReturnParty() {
        Optional<Party> result = partyRepository.findByBusinessIdAndId(businessId, party.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getPhone()).isEqualTo("9876543210");
    }

    @Test
    @DisplayName("countByBusinessIdAndIsActiveTrue should return active count")
    void countByBusinessIdAndIsActiveTrue_shouldReturnCount() {
        long count = partyRepository.countByBusinessIdAndIsActiveTrue(businessId);

        assertThat(count).isEqualTo(1);
    }
}
