package com.vyaparsetu.service;

import com.vyaparsetu.common.*;
import com.vyaparsetu.dto.inventory.*;
import com.vyaparsetu.dto.mapper.ItemMapper;
import com.vyaparsetu.dto.mapper.WarehouseMapper;
import com.vyaparsetu.entity.inventory.Inventory;
import com.vyaparsetu.entity.inventory.StockMovement;
import com.vyaparsetu.entity.inventory.Warehouse;
import com.vyaparsetu.entity.item.Item;
import com.vyaparsetu.repository.inventory.InventoryRepository;
import com.vyaparsetu.repository.inventory.StockMovementRepository;
import com.vyaparsetu.repository.inventory.WarehouseRepository;
import com.vyaparsetu.repository.item.ItemRepository;
import com.vyaparsetu.service.inventory.InventoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private StockMovementRepository stockMovementRepository;
    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private WarehouseMapper warehouseMapper;
    @Mock
    private ItemMapper itemMapper;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private InventoryService inventoryService;

    private UUID businessId;
    private UUID itemId;
    private UUID warehouseId;
    private Item item;
    private Warehouse warehouse;
    private Inventory inventory;
    private StockMovementRequest addStockRequest;
    private StockMovementRequest removeStockRequest;
    private StockTransferRequest transferRequest;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        itemId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();
        UUID toWarehouseId = UUID.randomUUID();

        item = Item.builder()
                .id(itemId)
                .name("Test Item")
                .sku("SKU001")
                .currentStock(new BigDecimal("100"))
                .build();

        warehouse = Warehouse.builder()
                .id(warehouseId)
                .businessId(businessId)
                .name("Main Warehouse")
                .isPrimary(true)
                .build();

        inventory = Inventory.builder()
                .id(UUID.randomUUID())
                .businessId(businessId)
                .itemId(itemId)
                .warehouseId(warehouseId)
                .quantity(new BigDecimal("100"))
                .build();

        addStockRequest = StockMovementRequest.builder()
                .itemId(itemId)
                .warehouseId(warehouseId)
                .movementType("STOCK_IN")
                .quantity(new BigDecimal("50"))
                .unitPrice(new BigDecimal("100"))
                .build();

        removeStockRequest = StockMovementRequest.builder()
                .itemId(itemId)
                .warehouseId(warehouseId)
                .movementType("STOCK_OUT")
                .quantity(new BigDecimal("30"))
                .build();

        transferRequest = StockTransferRequest.builder()
                .fromWarehouseId(warehouseId)
                .toWarehouseId(toWarehouseId)
                .itemId(itemId)
                .quantity(new BigDecimal("20"))
                .note("Warehouse transfer")
                .build();
    }

    @Test
    @DisplayName("addStock should increase inventory and create StockMovement")
    void addStock_shouldIncreaseInventory() {
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(businessId, itemId, warehouseId))
                .thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(inventory);
        when(stockMovementRepository.save(any(StockMovement.class))).thenReturn(mock(StockMovement.class));
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        StockMovementDto result = inventoryService.addStock(businessId, addStockRequest);

        assertThat(result).isNotNull();
        verify(inventoryRepository).save(any(Inventory.class));
        verify(stockMovementRepository).save(any(StockMovement.class));
        verify(auditService).logEvent(anyString(), eq("ADD_STOCK"), anyString(), any(), any(), any());
    }

    @Test
    @DisplayName("addStock should create new inventory record if none exists")
    void addStock_shouldCreateNewInventory_whenNotExists() {
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(businessId, itemId, warehouseId))
                .thenReturn(Optional.empty());
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(inventory);
        when(stockMovementRepository.save(any(StockMovement.class))).thenReturn(mock(StockMovement.class));
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        inventoryService.addStock(businessId, addStockRequest);

        verify(inventoryRepository).save(any(Inventory.class));
    }

    @Test
    @DisplayName("addStock should throw BadRequestException for zero quantity")
    void addStock_shouldThrowException_whenQuantityZero() {
        addStockRequest.setQuantity(BigDecimal.ZERO);
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));

        assertThatThrownBy(() -> inventoryService.addStock(businessId, addStockRequest))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("addStock should throw ResourceNotFoundException when item not found")
    void addStock_shouldThrowException_whenItemNotFound() {
        when(itemRepository.findById(itemId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.addStock(businessId, addStockRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("removeStock should decrease inventory and create StockMovement")
    void removeStock_shouldDecreaseInventory() {
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(businessId, itemId, warehouseId))
                .thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(inventory);
        when(stockMovementRepository.save(any(StockMovement.class))).thenReturn(mock(StockMovement.class));
        doNothing().when(auditService).logEvent(anyString(), anyString(), anyString(), any(), any(), any());

        StockMovementDto result = inventoryService.removeStock(businessId, removeStockRequest);

        assertThat(result).isNotNull();
        verify(inventoryRepository).save(any(Inventory.class));
    }

    @Test
    @DisplayName("removeStock should throw BadRequestException for insufficient stock")
    void removeStock_shouldThrowException_whenInsufficientStock() {
        removeStockRequest.setQuantity(new BigDecimal("200"));
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(businessId, itemId, warehouseId))
                .thenReturn(Optional.of(inventory));

        assertThatThrownBy(() -> inventoryService.removeStock(businessId, removeStockRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    @DisplayName("removeStock should throw BadRequestException when no inventory record")
    void removeStock_shouldThrowException_whenNoInventory() {
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(businessId, itemId, warehouseId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.removeStock(businessId, removeStockRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    @DisplayName("transferStock should create transfer in/out movements")
    void transferStock_shouldCreateMovements() {
        UUID toWarehouseId = UUID.randomUUID();
        transferRequest.setToWarehouseId(toWarehouseId);

        Warehouse toWarehouse = Warehouse.builder()
                .id(toWarehouseId)
                .businessId(businessId)
                .name("Secondary Warehouse")
                .build();

        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(warehouseRepository.findById(toWarehouseId)).thenReturn(Optional.of(toWarehouse));
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(businessId, itemId, warehouseId))
                .thenReturn(Optional.of(inventory));
        when(inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(businessId, itemId, toWarehouseId))
                .thenReturn(Optional.empty());
        when(inventoryRepository.save(any(Inventory.class))).thenReturn(inventory);
        when(stockMovementRepository.save(any(StockMovement.class))).thenReturn(mock(StockMovement.class));

        inventoryService.transferStock(businessId, transferRequest);

        verify(stockMovementRepository, times(2)).save(any(StockMovement.class));
    }

    @Test
    @DisplayName("transferStock should throw BadRequestException for insufficient stock")
    void transferStock_shouldThrowException_whenInsufficientStock() {
        transferRequest.setQuantity(new BigDecimal("500"));

        when(warehouseRepository.findById(any())).thenReturn(Optional.of(warehouse));
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(inventoryRepository.findByBusinessIdAndItemIdAndWarehouseId(businessId, itemId, warehouseId))
                .thenReturn(Optional.of(inventory));

        assertThatThrownBy(() -> inventoryService.transferStock(businessId, transferRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");
    }
}
