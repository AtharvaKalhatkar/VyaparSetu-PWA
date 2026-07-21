package com.vyaparsetu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.config.TestSecurityConfig;
import com.vyaparsetu.dto.party.PartyBalanceDto;
import com.vyaparsetu.dto.party.PartyCreateRequest;
import com.vyaparsetu.dto.party.PartyDto;
import com.vyaparsetu.dto.party.PartyLedgerDto;
import com.vyaparsetu.dto.party.PartyUpdateRequest;
import com.vyaparsetu.service.party.PartyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PartyController.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("test")
class PartyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PartyService partyService;

    private UUID businessId;
    private UUID partyId;
    private PartyDto partyDto;
    private PartyBalanceDto balanceDto;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        partyId = UUID.randomUUID();

        partyDto = PartyDto.builder()
                .id(partyId)
                .name("Test Party")
                .phone("9876543210")
                .email("party@test.com")
                .type("CUSTOMER")
                .country("India")
                .currentBalance(BigDecimal.ZERO)
                .build();

        balanceDto = PartyBalanceDto.builder()
                .partyId(partyId)
                .partyName("Test Party")
                .currentBalance(new BigDecimal("5000.00"))
                .balanceType("DEBIT")
                .asOfDate(LocalDate.now())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/parties should return 200 with paged parties")
    void getParties_shouldReturnOk() throws Exception {
        PagedResponse<PartyDto> pagedResponse = PagedResponse.of(
                List.of(partyDto), 0, 20, 1);

        when(partyService.getPartiesByBusiness(eq(businessId), isNull(), any()))
                .thenReturn(pagedResponse);

        mockMvc.perform(get("/api/v1/businesses/{businessId}/parties", businessId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].name").value("Test Party"));

        verify(partyService).getPartiesByBusiness(eq(businessId), isNull(), any());
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/parties?type=CUSTOMER should filter by type")
    void getParties_withTypeFilter_shouldReturnOk() throws Exception {
        PagedResponse<PartyDto> pagedResponse = PagedResponse.of(
                List.of(partyDto), 0, 20, 1);

        when(partyService.getPartiesByBusiness(eq(businessId), eq("CUSTOMER"), any()))
                .thenReturn(pagedResponse);

        mockMvc.perform(get("/api/v1/businesses/{businessId}/parties", businessId)
                        .param("type", "CUSTOMER")
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(partyService).getPartiesByBusiness(eq(businessId), eq("CUSTOMER"), any());
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/parties/{partyId} should return party")
    void getPartyById_shouldReturnOk() throws Exception {
        when(partyService.getPartyById(businessId, partyId)).thenReturn(partyDto);

        mockMvc.perform(get("/api/v1/businesses/{businessId}/parties/{partyId}", businessId, partyId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Test Party"));

        verify(partyService).getPartyById(businessId, partyId);
    }

    @Test
    @DisplayName("POST /api/v1/businesses/{businessId}/parties should return 201")
    void createParty_shouldReturnCreated() throws Exception {
        PartyCreateRequest request = PartyCreateRequest.builder()
                .name("New Party")
                .phone("9876543210")
                .type("CUSTOMER")
                .build();

        when(partyService.createParty(eq(businessId), any(PartyCreateRequest.class)))
                .thenReturn(partyDto);

        mockMvc.perform(post("/api/v1/businesses/{businessId}/parties", businessId)
                        .with(user("test@vyaparsetu.com").roles("OWNER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Party created"));

        verify(partyService).createParty(eq(businessId), any(PartyCreateRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/businesses/{businessId}/parties should return 400 for missing name")
    void createParty_shouldReturnBadRequest_whenInvalid() throws Exception {
        PartyCreateRequest request = PartyCreateRequest.builder()
                .name("")
                .phone("")
                .build();

        mockMvc.perform(post("/api/v1/businesses/{businessId}/parties", businessId)
                        .with(user("test@vyaparsetu.com").roles("OWNER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(partyService, never()).createParty(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/businesses/{businessId}/parties/{partyId} should return 200")
    void updateParty_shouldReturnOk() throws Exception {
        PartyUpdateRequest request = PartyUpdateRequest.builder()
                .name("Updated Party")
                .phone("9876543211")
                .build();

        PartyDto updatedDto = PartyDto.builder()
                .id(partyId)
                .name("Updated Party")
                .phone("9876543211")
                .build();

        when(partyService.updateParty(eq(businessId), eq(partyId), any(PartyUpdateRequest.class)))
                .thenReturn(updatedDto);

        mockMvc.perform(put("/api/v1/businesses/{businessId}/parties/{partyId}", businessId, partyId)
                        .with(user("test@vyaparsetu.com").roles("OWNER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Party updated"));

        verify(partyService).updateParty(eq(businessId), eq(partyId), any(PartyUpdateRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/businesses/{businessId}/parties/{partyId} should return 200")
    void deleteParty_shouldReturnOk() throws Exception {
        doNothing().when(partyService).deleteParty(businessId, partyId);

        mockMvc.perform(delete("/api/v1/businesses/{businessId}/parties/{partyId}", businessId, partyId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Party deleted"));

        verify(partyService).deleteParty(businessId, partyId);
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/parties/search?query=test should return results")
    void searchParties_shouldReturnOk() throws Exception {
        PagedResponse<PartyDto> pagedResponse = PagedResponse.of(
                List.of(partyDto), 0, 20, 1);

        when(partyService.searchParties(eq(businessId), eq("test"), any()))
                .thenReturn(pagedResponse);

        mockMvc.perform(get("/api/v1/businesses/{businessId}/parties/search", businessId)
                        .param("query", "test")
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(partyService).searchParties(eq(businessId), eq("test"), any());
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/parties/outstanding should return list")
    void getOutstandingParties_shouldReturnOk() throws Exception {
        when(partyService.getOutstandingParties(businessId))
                .thenReturn(List.of(balanceDto));

        mockMvc.perform(get("/api/v1/businesses/{businessId}/parties/outstanding", businessId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].partyName").value("Test Party"));

        verify(partyService).getOutstandingParties(businessId);
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/parties/{partyId} should return 404 when not found")
    void getPartyById_shouldReturn404_whenNotFound() throws Exception {
        when(partyService.getPartyById(businessId, partyId))
                .thenThrow(new com.vyaparsetu.common.ResourceNotFoundException("Party", partyId));

        mockMvc.perform(get("/api/v1/businesses/{businessId}/parties/{partyId}", businessId, partyId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isNotFound());

        verify(partyService).getPartyById(businessId, partyId);
    }
}
