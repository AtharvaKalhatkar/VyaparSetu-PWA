package com.vyaparsetu.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.config.TestSecurityConfig;
import com.vyaparsetu.dto.invoice.InvoiceCreateRequest;
import com.vyaparsetu.dto.invoice.InvoiceDto;
import com.vyaparsetu.dto.invoice.InvoiceItemDto;
import com.vyaparsetu.dto.invoice.InvoiceItemRequest;
import com.vyaparsetu.entity.invoice.InvoiceSequence;
import com.vyaparsetu.service.invoice.InvoiceService;
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
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(InvoiceController.class)
@Import(TestSecurityConfig.class)
@ActiveProfiles("test")
class InvoiceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InvoiceService invoiceService;

    private UUID businessId;
    private UUID invoiceId;
    private UUID partyId;
    private InvoiceDto invoiceDto;
    private InvoiceCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        invoiceId = UUID.randomUUID();
        partyId = UUID.randomUUID();

        InvoiceItemDto itemDto = InvoiceItemDto.builder()
                .itemId(UUID.randomUUID())
                .quantity(new BigDecimal("2"))
                .rate(new BigDecimal("500"))
                .totalAmount(new BigDecimal("1000"))
                .build();

        invoiceDto = InvoiceDto.builder()
                .id(invoiceId)
                .invoiceNo("INV-000001")
                .invoiceType("TAX_INVOICE")
                .partyId(partyId)
                .partyName("Test Party")
                .invoiceDate(LocalDate.now())
                .status("CONFIRMED")
                .subtotal(new BigDecimal("1000"))
                .grandTotal(new BigDecimal("1180"))
                .totalGst(new BigDecimal("180"))
                .items(List.of(itemDto))
                .build();

        InvoiceItemRequest itemRequest = InvoiceItemRequest.builder()
                .itemId(UUID.randomUUID())
                .quantity(new BigDecimal("2"))
                .rate(new BigDecimal("500"))
                .gstRate(new BigDecimal("18"))
                .build();

        createRequest = InvoiceCreateRequest.builder()
                .invoiceType("TAX_INVOICE")
                .partyId(partyId)
                .invoiceDate(LocalDate.now())
                .subtotal(new BigDecimal("1000"))
                .grandTotal(new BigDecimal("1180"))
                .paidAmount(BigDecimal.ZERO)
                .items(List.of(itemRequest))
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/invoices should return paged invoices")
    void getInvoices_shouldReturnOk() throws Exception {
        PagedResponse<InvoiceDto> pagedResponse = PagedResponse.of(
                List.of(invoiceDto), 0, 20, 1);

        when(invoiceService.getInvoicesByBusiness(eq(businessId), isNull(), isNull(), isNull(), any()))
                .thenReturn(pagedResponse);

        mockMvc.perform(get("/api/v1/businesses/{businessId}/invoices", businessId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].invoiceNo").value("INV-000001"));

        verify(invoiceService).getInvoicesByBusiness(eq(businessId), isNull(), isNull(), isNull(), any());
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/invoices/{invoiceId} should return invoice")
    void getInvoiceById_shouldReturnOk() throws Exception {
        when(invoiceService.getInvoiceById(businessId, invoiceId)).thenReturn(invoiceDto);

        mockMvc.perform(get("/api/v1/businesses/{businessId}/invoices/{invoiceId}", businessId, invoiceId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.invoiceNo").value("INV-000001"));

        verify(invoiceService).getInvoiceById(businessId, invoiceId);
    }

    @Test
    @DisplayName("POST /api/v1/businesses/{businessId}/invoices should return 201")
    void createInvoice_shouldReturnCreated() throws Exception {
        when(invoiceService.createInvoice(eq(businessId), any(InvoiceCreateRequest.class)))
                .thenReturn(invoiceDto);

        mockMvc.perform(post("/api/v1/businesses/{businessId}/invoices", businessId)
                        .with(user("test@vyaparsetu.com").roles("OWNER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Invoice created"));

        verify(invoiceService).createInvoice(eq(businessId), any(InvoiceCreateRequest.class));
    }

    @Test
    @DisplayName("PUT /api/v1/businesses/{businessId}/invoices/{invoiceId} should return 200")
    void updateInvoice_shouldReturnOk() throws Exception {
        when(invoiceService.updateInvoice(eq(businessId), eq(invoiceId), any(InvoiceCreateRequest.class)))
                .thenReturn(invoiceDto);

        mockMvc.perform(put("/api/v1/businesses/{businessId}/invoices/{invoiceId}", businessId, invoiceId)
                        .with(user("test@vyaparsetu.com").roles("OWNER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Invoice updated"));

        verify(invoiceService).updateInvoice(eq(businessId), eq(invoiceId), any(InvoiceCreateRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/businesses/{businessId}/invoices/{invoiceId} should return 200")
    void deleteInvoice_shouldReturnOk() throws Exception {
        doNothing().when(invoiceService).deleteInvoice(businessId, invoiceId);

        mockMvc.perform(delete("/api/v1/businesses/{businessId}/invoices/{invoiceId}", businessId, invoiceId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Invoice deleted"));

        verify(invoiceService).deleteInvoice(businessId, invoiceId);
    }

    @Test
    @DisplayName("POST /api/v1/businesses/{businessId}/invoices/{invoiceId}/cancel should return 200")
    void cancelInvoice_shouldReturnOk() throws Exception {
        doNothing().when(invoiceService).cancelInvoice(businessId, invoiceId);

        mockMvc.perform(post("/api/v1/businesses/{businessId}/invoices/{invoiceId}/cancel", businessId, invoiceId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Invoice cancelled"));

        verify(invoiceService).cancelInvoice(businessId, invoiceId);
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/invoices/{invoiceId}/pdf should return PDF")
    void generateInvoicePdf_shouldReturnPdf() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 test pdf content".getBytes();
        when(invoiceService.generateInvoicePdf(businessId, invoiceId)).thenReturn(pdfBytes);

        mockMvc.perform(get("/api/v1/businesses/{businessId}/invoices/{invoiceId}/pdf", businessId, invoiceId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(pdfBytes));

        verify(invoiceService).generateInvoicePdf(businessId, invoiceId);
    }

    @Test
    @DisplayName("POST /api/v1/businesses/{businessId}/invoices/{invoiceId}/irn should return IRN data")
    void generateIrn_shouldReturnOk() throws Exception {
        Map<String, Object> irnData = Map.of("irn", "IRN123456", "ackNo", "ACK123456");
        when(invoiceService.generateIrn(businessId, invoiceId)).thenReturn(irnData);

        mockMvc.perform(post("/api/v1/businesses/{businessId}/invoices/{invoiceId}/irn", businessId, invoiceId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.irn").value("IRN123456"));

        verify(invoiceService).generateIrn(businessId, invoiceId);
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/invoices/next-number should return next number")
    void getNextInvoiceNumber_shouldReturnOk() throws Exception {
        when(invoiceService.getNextInvoiceNumber(eq(businessId), any()))
                .thenReturn("INV-000002");

        mockMvc.perform(get("/api/v1/businesses/{businessId}/invoices/next-number", businessId)
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value("INV-000002"));

        verify(invoiceService).getNextInvoiceNumber(eq(businessId), any());
    }

    @Test
    @DisplayName("GET /api/v1/businesses/{businessId}/invoices/number/{invoiceNo} should return invoice")
    void getInvoiceByNumber_shouldReturnOk() throws Exception {
        when(invoiceService.getInvoiceByNumber(businessId, "INV-000001")).thenReturn(invoiceDto);

        mockMvc.perform(get("/api/v1/businesses/{businessId}/invoices/number/{invoiceNo}", businessId, "INV-000001")
                        .with(user("test@vyaparsetu.com").roles("OWNER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.invoiceNo").value("INV-000001"));

        verify(invoiceService).getInvoiceByNumber(businessId, "INV-000001");
    }

    @Test
    @DisplayName("POST /api/v1/businesses/{businessId}/invoices should return 400 for missing party")
    void createInvoice_shouldReturnBadRequest_whenInvalid() throws Exception {
        InvoiceCreateRequest invalidRequest = InvoiceCreateRequest.builder()
                .invoiceType("TAX_INVOICE")
                .grandTotal(new BigDecimal("1000"))
                .build();

        mockMvc.perform(post("/api/v1/businesses/{businessId}/invoices", businessId)
                        .with(user("test@vyaparsetu.com").roles("OWNER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(invoiceService, never()).createInvoice(any(), any());
    }
}
