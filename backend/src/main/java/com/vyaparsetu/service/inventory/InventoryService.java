package com.vyaparsetu.service.inventory;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.BadRequestException;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.inventory.InventoryDto;
import com.vyaparsetu.dto.inventory.StockAuditRequest;
import com.vyaparsetu.dto.inventory.StockMovementDto;
import com.vyaparsetu.dto.inventory.StockMovementRequest;
import com.vyaparsetu.dto.inventory.StockTransferRequest;
import com.vyaparsetu.dto.mapper.ItemMapper;
import com.vyaparsetu.dto.mapper.WarehouseMapper;
import com.vyaparsetu.entity.inventory.Inventory;
import com.vyaparsetu.entity.inventory.StockMovement;
import com.vyaparsetu.entity.inventory.StockMovement.MovementType;
import com.vyaparsetu.entity.inventory.Warehouse;
import com.vyaparsetu.entity.item.Item;
import com.vyaparsetu.repository.inventory.InventoryRepository;
import com.vyaparsetu.repository.inventory.StockMovementRepository;
import com.vyaparsetu.repository.inventory.WarehouseRepository;
import com.vyaparsetu.repository.item.ItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final WarehouseRepository warehouseRepository;
    private final ItemRepository itemRepository;
    private final WarehouseMapper warehouseMapper;
    private final ItemMapper itemMapper;
    private final AuditService auditService;

    @Transactional
    public StockMovementDto addStock(UUID businessId, StockMovementRequest request) {
        log.info("Adding stock in business: {}", businessId);

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item", request.getItemId()));
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", request.getWarehouseId()));

        if (request.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Quantity must be positive");
        }

        Optional<Inventory> existingInventory = inventoryRepository
                .findByBusinessIdAndItemIdAndWarehouseId(businessId, request.getItemId(), request.getWarehouseId());

        Inventory inventory = existingInventory.orElseGet(() ->
                Inventory.builder()
                        .businessId(businessId)
                        .itemId(request.getItemId())
                        .warehouseId(request.getWarehouseId())
                        .quantity(BigDecimal.ZERO)
                        .build());

        inventory.setQuantity(inventory.getQuantity().add(request.getQuantity()));
        if (request.getBatchNo() != null) inventory.setBatchNo(request.getBatchNo());
        if (request.getExpiryDate() != null) inventory.setExpiryDate(request.getExpiryDate());
        if (request.getMfgDate() != null) inventory.setMfgDate(request.getMfgDate());
        if (request.getUnitPrice() != null) {
            inventory.setPurchasePrice(request.getUnitPrice());
        }
        inventoryRepository.save(inventory);

        item.setCurrentStock(item.getCurrentStock().add(request.getQuantity()));
        itemRepository.save(item);

        StockMovement movement = StockMovement.builder()
                .businessId(businessId)
                .itemId(request.getItemId())
                .warehouseId(request.getWarehouseId())
                .movementType(MovementType.STOCK_IN)
                .quantity(request.getQuantity())
                .batchNo(request.getBatchNo())
                .expiryDate(request.getExpiryDate())
                .mfgDate(request.getMfgDate())
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .note(request.getNote())
                .unitPrice(request.getUnitPrice())
                .totalAmount(request.getUnitPrice() != null ?
                        request.getUnitPrice().multiply(request.getQuantity()) : null)
                .build();
        movement = stockMovementRepository.save(movement);

        auditService.logEvent(businessId.toString(), "ADD_STOCK", "StockMovement",
                movement.getId(), null, Map.of("itemId", request.getItemId().toString(),
                        "quantity", request.getQuantity().toString()));

        return toMovementDto(movement);
    }

    @Transactional
    public StockMovementDto removeStock(UUID businessId, StockMovementRequest request) {
        log.info("Removing stock in business: {}", businessId);

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item", request.getItemId()));
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", request.getWarehouseId()));

        Optional<Inventory> existingInventory = inventoryRepository
                .findByBusinessIdAndItemIdAndWarehouseId(businessId, request.getItemId(), request.getWarehouseId());

        if (existingInventory.isEmpty() || existingInventory.get().getQuantity().compareTo(request.getQuantity()) < 0) {
            throw new BadRequestException("Insufficient stock");
        }

        Inventory inventory = existingInventory.get();
        inventory.setQuantity(inventory.getQuantity().subtract(request.getQuantity()));
        inventoryRepository.save(inventory);

        item.setCurrentStock(item.getCurrentStock().subtract(request.getQuantity()));
        itemRepository.save(item);

        StockMovement movement = StockMovement.builder()
                .businessId(businessId)
                .itemId(request.getItemId())
                .warehouseId(request.getWarehouseId())
                .movementType(MovementType.STOCK_OUT)
                .quantity(request.getQuantity())
                .batchNo(request.getBatchNo())
                .expiryDate(request.getExpiryDate())
                .mfgDate(request.getMfgDate())
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .note(request.getNote())
                .unitPrice(request.getUnitPrice())
                .totalAmount(request.getUnitPrice() != null ?
                        request.getUnitPrice().multiply(request.getQuantity()) : null)
                .build();
        movement = stockMovementRepository.save(movement);

        auditService.logEvent(businessId.toString(), "REMOVE_STOCK", "StockMovement",
                movement.getId(), null, Map.of("itemId", request.getItemId().toString(),
                        "quantity", request.getQuantity().toString()));

        return toMovementDto(movement);
    }

    @Transactional
    public void transferStock(UUID businessId, StockTransferRequest request) {
        log.info("Transferring stock in business: {} from {} to {}", businessId,
                request.getFromWarehouseId(), request.getToWarehouseId());

        Warehouse fromWarehouse = warehouseRepository.findById(request.getFromWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Source Warehouse", request.getFromWarehouseId()));
        Warehouse toWarehouse = warehouseRepository.findById(request.getToWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination Warehouse", request.getToWarehouseId()));

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item", request.getItemId()));

        Optional<Inventory> sourceInventory = inventoryRepository
                .findByBusinessIdAndItemIdAndWarehouseId(businessId, request.getItemId(), request.getFromWarehouseId());

        if (sourceInventory.isEmpty() || sourceInventory.get().getQuantity().compareTo(request.getQuantity()) < 0) {
            throw new BadRequestException("Insufficient stock in source warehouse");
        }

        Inventory source = sourceInventory.get();
        source.setQuantity(source.getQuantity().subtract(request.getQuantity()));
        inventoryRepository.save(source);

        Optional<Inventory> destInventory = inventoryRepository
                .findByBusinessIdAndItemIdAndWarehouseId(businessId, request.getItemId(), request.getToWarehouseId());

        Inventory dest = destInventory.orElseGet(() ->
                Inventory.builder()
                        .businessId(businessId)
                        .itemId(request.getItemId())
                        .warehouseId(request.getToWarehouseId())
                        .quantity(BigDecimal.ZERO)
                        .build());
        dest.setQuantity(dest.getQuantity().add(request.getQuantity()));
        inventoryRepository.save(dest);

        StockMovement transferOut = StockMovement.builder()
                .businessId(businessId)
                .itemId(request.getItemId())
                .warehouseId(request.getFromWarehouseId())
                .movementType(MovementType.TRANSFER_OUT)
                .quantity(request.getQuantity())
                .note(request.getNote())
                .build();
        stockMovementRepository.save(transferOut);

        StockMovement transferIn = StockMovement.builder()
                .businessId(businessId)
                .itemId(request.getItemId())
                .warehouseId(request.getToWarehouseId())
                .movementType(MovementType.TRANSFER_IN)
                .quantity(request.getQuantity())
                .note(request.getNote())
                .build();
        stockMovementRepository.save(transferIn);
    }

    @Transactional(readOnly = true)
    public List<InventoryDto> getInventoryByItem(UUID businessId, UUID itemId) {
        List<Inventory> inventories = inventoryRepository.findByBusinessIdAndItemId(businessId, itemId);
        return inventories.stream().map(this::toInventoryDto).toList();
    }

    @Transactional(readOnly = true)
    public List<InventoryDto> getInventoryByWarehouse(UUID businessId, UUID warehouseId) {
        List<Inventory> inventories = inventoryRepository.findByBusinessIdAndWarehouseId(businessId, warehouseId);
        return inventories.stream().map(this::toInventoryDto).toList();
    }

    @Transactional(readOnly = true)
    public Page<StockMovementDto> getStockMovements(UUID businessId, UUID itemId, Pageable pageable) {
        Page<StockMovement> movements;
        if (itemId != null) {
            List<StockMovement> movementList = stockMovementRepository.findByBusinessIdAndItemId(businessId, itemId);
            movements = new org.springframework.data.domain.PageImpl<>(movementList, pageable, movementList.size());
        } else {
            movements = stockMovementRepository.findByBusinessId(businessId, pageable);
        }
        return movements.map(this::toMovementDto);
    }

    @Transactional(readOnly = true)
    public List<InventoryDto> getWarehouseStock(UUID businessId, UUID warehouseId) {
        return getInventoryByWarehouse(businessId, warehouseId);
    }

    @Transactional
    public void performStockAudit(UUID businessId, StockAuditRequest request) {
        log.info("Performing stock audit for warehouse: {} in business: {}", request.getWarehouseId(), businessId);

        for (StockAuditRequest.AuditItem auditItem : request.getItems()) {
            Optional<Inventory> existingInventory = inventoryRepository
                    .findByBusinessIdAndItemIdAndWarehouseId(businessId, auditItem.getItemId(), request.getWarehouseId());

            if (existingInventory.isPresent()) {
                Inventory inv = existingInventory.get();
                BigDecimal diff = auditItem.getActualQty().subtract(inv.getQuantity());

                if (diff.compareTo(BigDecimal.ZERO) != 0) {
                    inv.setQuantity(auditItem.getActualQty());
                    inventoryRepository.save(inv);

                    Item item = itemRepository.findById(auditItem.getItemId())
                            .orElse(null);
                    if (item != null) {
                        item.setCurrentStock(item.getCurrentStock().add(diff));
                        itemRepository.save(item);
                    }

                    StockMovement movement = StockMovement.builder()
                            .businessId(businessId)
                            .itemId(auditItem.getItemId())
                            .warehouseId(request.getWarehouseId())
                            .movementType(MovementType.AUDIT_ADJUSTMENT)
                            .quantity(diff.abs())
                            .note("Audit adjustment: expected=" + auditItem.getExpectedQty()
                                    + ", actual=" + auditItem.getActualQty())
                            .build();
                    stockMovementRepository.save(movement);
                }
            }
        }

        auditService.logEvent(businessId.toString(), "STOCK_AUDIT", "Inventory",
                request.getWarehouseId(), null, Map.of("items", String.valueOf(request.getItems().size())));
    }

    private InventoryDto toInventoryDto(Inventory inventory) {
        Item item = itemRepository.findById(inventory.getItemId()).orElse(null);
        Warehouse warehouse = warehouseRepository.findById(inventory.getWarehouseId()).orElse(null);

        return InventoryDto.builder()
                .id(inventory.getId())
                .itemId(inventory.getItemId())
                .itemName(item != null ? item.getName() : null)
                .itemSku(item != null ? item.getSku() : null)
                .warehouseId(inventory.getWarehouseId())
                .warehouseName(warehouse != null ? warehouse.getName() : null)
                .quantity(inventory.getQuantity())
                .batchNo(inventory.getBatchNo())
                .expiryDate(inventory.getExpiryDate())
                .mfgDate(inventory.getMfgDate())
                .purchasePrice(inventory.getPurchasePrice())
                .sellingPrice(inventory.getSellingPrice())
                .location(inventory.getLocation())
                .build();
    }

    private StockMovementDto toMovementDto(StockMovement movement) {
        Item item = itemRepository.findById(movement.getItemId()).orElse(null);
        Warehouse warehouse = warehouseRepository.findById(movement.getWarehouseId()).orElse(null);

        return StockMovementDto.builder()
                .id(movement.getId())
                .itemId(movement.getItemId())
                .itemName(item != null ? item.getName() : null)
                .warehouseId(movement.getWarehouseId())
                .warehouseName(warehouse != null ? warehouse.getName() : null)
                .movementType(movement.getMovementType() != null ? movement.getMovementType().name() : null)
                .quantity(movement.getQuantity())
                .batchNo(movement.getBatchNo())
                .expiryDate(movement.getExpiryDate())
                .referenceType(movement.getReferenceType())
                .referenceId(movement.getReferenceId())
                .note(movement.getNote())
                .unitPrice(movement.getUnitPrice())
                .totalAmount(movement.getTotalAmount())
                .createdAt(movement.getCreatedAt())
                .build();
    }
}
