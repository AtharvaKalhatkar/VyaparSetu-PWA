package com.vyaparsetu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.config.TestSecurityConfig;
import com.vyaparsetu.dto.item.ItemCreateRequest;
import com.vyaparsetu.dto.item.ItemDto;
import com.vyaparsetu.dto.item.ItemUpdateRequest;
import com.vyaparsetu.service.item.ItemService;
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
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ItemController.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("test")
class ItemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ItemService itemService;

    private UUID businessId;
    private UUID itemId;
    private ItemDto itemDto;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        itemId = UUID.randomUUID();

        itemDto = ItemDto.builder()
                .id(itemId)
                .name("Test Item")
                .sku("SKU001")
                .barcode("BARCODE001")
                .hsnCode("84713000")
                .gstRate(new BigDecimal("18"))
                .purchasePrice(new BigDecimal("800"))
                .sellingPrice(new BigDecimal("1000"))
                .currentStock(new BigDecimal("50"))
                .minStockLevel(new BigDecimal("10"))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/items should return paged items")
    void getItems_shouldReturnOk() throws Exception {
        PagedResponse<ItemDto> pagedResponse = PagedResponse.of(
                List.of(itemDto), 0, 20, 1);

        when(itemService.getItemsByBusiness(eq(businessId), isNull(), any()))
                .thenReturn(pagedResponse);

        mockMvc.perform(get("/api/v1/businesses/{businessId}/items", businessId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].name").value("Test Item"));

        verify(itemService).getItemsByBusiness(eq(businessId), isNull(), any());
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/items/{itemId} should return item")
    void getItemById_shouldReturnOk() throws Exception {
        when(itemService.getItemById(businessId, itemId)).thenReturn(itemDto);

        mockMvc.perform(get("/api/v1/businesses/{businessId}/items/{itemId}", businessId, itemId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Test Item"));

        verify(itemService).getItemById(businessId, itemId);
    }

    @Test
    @DisplayName("POST /api/v1/businesses/{businessId}/items should return 201")
    void createItem_shouldReturnCreated() throws Exception {
        ItemCreateRequest request = ItemCreateRequest.builder()
                .name("New Item")
                .sku("SKU002")
                .sellingPrice(new BigDecimal("1000"))
                .build();

        when(itemService.createItem(eq(businessId), any(ItemCreateRequest.class)))
                .thenReturn(itemDto);

        mockMvc.perform(post("/api/v1/businesses/{businessId}/items", businessId)
                        .with(user("test@vyaparsetu.com").roles("OWNER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Item created"));

        verify(itemService).createItem(eq(businessId), any(ItemCreateRequest.class));
    }

    @Test
    @DisplayName("POST /api/v1/businesses/{businessId}/items should return 400 for missing fields")
    void createItem_shouldReturnBadRequest_whenInvalid() throws Exception {
        ItemCreateRequest request = ItemCreateRequest.builder()
                .name("")
                .sku("")
                .build();

        mockMvc.perform(post("/api/v1/businesses/{businessId}/items", businessId)
                        .with(user("test@vyaparsetu.com").roles("OWNER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(itemService, never()).createItem(any(), any());
    }

    @Test
    @DisplayName("PUT /api/v1/businesses/{businessId}/items/{itemId} should return 200")
    void updateItem_shouldReturnOk() throws Exception {
        ItemUpdateRequest request = ItemUpdateRequest.builder()
                .name("Updated Item")
                .sellingPrice(new BigDecimal("1200"))
                .build();

        ItemDto updatedDto = ItemDto.builder()
                .id(itemId)
                .name("Updated Item")
                .sku("SKU001")
                .sellingPrice(new BigDecimal("1200"))
                .build();

        when(itemService.updateItem(eq(businessId), eq(itemId), any(ItemUpdateRequest.class)))
                .thenReturn(updatedDto);

        mockMvc.perform(put("/api/v1/businesses/{businessId}/items/{itemId}", businessId, itemId)
                        .with(user("test@vyaparsetu.com").roles("OWNER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Item updated"))
                .andExpect(jsonPath("$.data.name").value("Updated Item"));

        verify(itemService).updateItem(eq(businessId), eq(itemId), any(ItemUpdateRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/businesses/{businessId}/items/{itemId} should return 200")
    void deleteItem_shouldReturnOk() throws Exception {
        doNothing().when(itemService).deleteItem(businessId, itemId);

        mockMvc.perform(delete("/api/v1/businesses/{businessId}/items/{itemId}", businessId, itemId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Item deleted"));

        verify(itemService).deleteItem(businessId, itemId);
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/items/search?query=test should return results")
    void searchItems_shouldReturnOk() throws Exception {
        PagedResponse<ItemDto> pagedResponse = PagedResponse.of(
                List.of(itemDto), 0, 20, 1);

        when(itemService.searchItems(eq(businessId), eq("test"), any()))
                .thenReturn(pagedResponse);

        mockMvc.perform(get("/api/v1/businesses/{businessId}/items/search", businessId)
                        .param("query", "test")
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].name").value("Test Item"));

        verify(itemService).searchItems(eq(businessId), eq("test"), any());
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/items/low-stock should return low stock items")
    void getLowStockItems_shouldReturnOk() throws Exception {
        when(itemService.getLowStockItems(businessId)).thenReturn(List.of(itemDto));

        mockMvc.perform(get("/api/v1/businesses/{businessId}/items/low-stock", businessId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Test Item"));

        verify(itemService).getLowStockItems(businessId);
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/items/barcode/{barcode} should return item")
    void findByBarcode_shouldReturnOk() throws Exception {
        when(itemService.findByBarcode(businessId, "BARCODE001")).thenReturn(itemDto);

        mockMvc.perform(get("/api/v1/businesses/{businessId}/items/barcode/{barcode}", businessId, "BARCODE001")
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.barcode").value("BARCODE001"));

        verify(itemService).findByBarcode(businessId, "BARCODE001");
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/items/barcode/{barcode} should return 404 when not found")
    void findByBarcode_shouldReturn404_whenNotFound() throws Exception {
        when(itemService.findByBarcode(businessId, "INVALID"))
                .thenThrow(new com.vyaparsetu.common.ResourceNotFoundException("Item not found with barcode: INVALID"));

        mockMvc.perform(get("/api/v1/businesses/{businessId}/items/barcode/{barcode}", businessId, "INVALID")
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isNotFound());

        verify(itemService).findByBarcode(businessId, "INVALID");
    }
}
