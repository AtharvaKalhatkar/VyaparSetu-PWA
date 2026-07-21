package com.vyaparsetu.service.item;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.DuplicateResourceException;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.item.ItemCreateRequest;
import com.vyaparsetu.dto.item.ItemDto;
import com.vyaparsetu.dto.item.ItemUpdateRequest;
import com.vyaparsetu.dto.mapper.ItemMapper;
import com.vyaparsetu.entity.item.Item;
import com.vyaparsetu.repository.inventory.InventoryRepository;
import com.vyaparsetu.repository.item.BrandRepository;
import com.vyaparsetu.repository.item.CategoryRepository;
import com.vyaparsetu.repository.item.ItemRepository;
import com.vyaparsetu.repository.item.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final UnitRepository unitRepository;
    private final InventoryRepository inventoryRepository;
    private final ItemMapper itemMapper;
    private final AuditService auditService;

    @Transactional
    public ItemDto createItem(UUID businessId, ItemCreateRequest request) {
        log.info("Creating item in business: {}", businessId);

        if (request.getSku() != null) {
            itemRepository.findByBusinessIdAndSku(businessId, request.getSku())
                    .ifPresent(i -> { throw new DuplicateResourceException("Item", "sku", request.getSku()); });
        }
        if (request.getBarcode() != null) {
            itemRepository.findByBusinessIdAndBarcode(businessId, request.getBarcode())
                    .ifPresent(i -> { throw new DuplicateResourceException("Item", "barcode", request.getBarcode()); });
        }

        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
        }
        if (request.getBrandId() != null) {
            brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new ResourceNotFoundException("Brand", request.getBrandId()));
        }
        if (request.getUnitId() != null) {
            unitRepository.findById(request.getUnitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unit", request.getUnitId()));
        }

        Item item = itemMapper.toEntity(request);
        item.setBusinessId(businessId);
        item = itemRepository.save(item);

        auditService.logEvent(businessId.toString(), "CREATE_ITEM", "Item", item.getId(),
                null, Map.of("name", item.getName(), "sku", item.getSku()));

        return itemMapper.toDto(item);
    }

    @Transactional
    public ItemDto updateItem(UUID businessId, UUID itemId, ItemUpdateRequest request) {
        log.info("Updating item: {} in business: {}", itemId, businessId);

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", itemId));

        if (request.getName() != null) item.setName(request.getName());
        if (request.getSku() != null) item.setSku(request.getSku());
        if (request.getBarcode() != null) item.setBarcode(request.getBarcode());
        if (request.getHsnCode() != null) item.setHsnCode(request.getHsnCode());
        if (request.getGstRate() != null) item.setGstRate(request.getGstRate());
        if (request.getCategoryId() != null) item.setCategoryId(request.getCategoryId());
        if (request.getBrandId() != null) item.setBrandId(request.getBrandId());
        if (request.getUnitId() != null) item.setUnitId(request.getUnitId());
        if (request.getPurchasePrice() != null) item.setPurchasePrice(request.getPurchasePrice());
        if (request.getSellingPrice() != null) item.setSellingPrice(request.getSellingPrice());
        if (request.getMrp() != null) item.setMrp(request.getMrp());
        if (request.getMinStockLevel() != null) item.setMinStockLevel(request.getMinStockLevel());
        if (request.getIsBatchTracked() != null) item.setBatchTracked(request.getIsBatchTracked());
        if (request.getHasExpiry() != null) item.setHasExpiry(request.getHasExpiry());
        if (request.getTaxType() != null) item.setTaxType(Item.TaxType.valueOf(request.getTaxType()));
        if (request.getCess() != null) item.setCess(request.getCess());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getImageUrl() != null) item.setImageUrl(request.getImageUrl());
        if (request.getTags() != null) item.setTags(request.getTags());
        if (request.getIsService() != null) item.setService(request.getIsService());

        item = itemRepository.save(item);

        auditService.logEvent(businessId.toString(), "UPDATE_ITEM", "Item", itemId,
                null, Map.of("name", item.getName()));

        return itemMapper.toDto(item);
    }

    @Transactional
    public void deleteItem(UUID businessId, UUID itemId) {
        log.info("Deleting item: {} in business: {}", itemId, businessId);

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", itemId));
        item.setDeleted(true);
        itemRepository.save(item);

        auditService.logEvent(businessId.toString(), "DELETE_ITEM", "Item", itemId, null, null);
    }

    @Transactional(readOnly = true)
    public ItemDto getItemById(UUID businessId, UUID itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item", itemId));
        ItemDto dto = itemMapper.toDto(item);
        BigDecimal totalStock = inventoryRepository.getStockByItemId(businessId, itemId);
        dto.setCurrentStock(totalStock != null ? totalStock : BigDecimal.ZERO);
        return dto;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ItemDto> getItemsByBusiness(UUID businessId, String categoryId, Pageable pageable) {
        Page<Item> itemPage;
        if (categoryId != null && !categoryId.isBlank()) {
            itemPage = itemRepository.findByBusinessIdAndCategoryId(businessId, UUID.fromString(categoryId), pageable);
        } else {
            itemPage = itemRepository.findByBusinessId(businessId, pageable);
        }
        List<ItemDto> dtos = itemMapper.toDtoList(itemPage.getContent());
        dtos.forEach(d -> {
            BigDecimal stock = inventoryRepository.getStockByItemId(businessId, d.getId());
            d.setCurrentStock(stock != null ? stock : BigDecimal.ZERO);
        });
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                itemPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PagedResponse<ItemDto> searchItems(UUID businessId, String query, Pageable pageable) {
        Page<Item> itemPage = itemRepository.searchItems(businessId, query, pageable);
        List<ItemDto> dtos = itemMapper.toDtoList(itemPage.getContent());
        dtos.forEach(d -> {
            BigDecimal stock = inventoryRepository.getStockByItemId(businessId, d.getId());
            d.setCurrentStock(stock != null ? stock : BigDecimal.ZERO);
        });
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                itemPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<ItemDto> getLowStockItems(UUID businessId) {
        List<Item> items = itemRepository.findByBusinessIdAndCurrentStockLessThanEqual(businessId, BigDecimal.ZERO);
        List<Item> allItems = itemRepository.findByBusinessIdAndIsActiveTrue(businessId);
        List<Item> lowStock = allItems.stream()
                .filter(i -> i.getCurrentStock() != null && i.getMinStockLevel() != null
                        && i.getCurrentStock().compareTo(i.getMinStockLevel()) <= 0)
                .toList();

        return itemMapper.toDtoList(lowStock);
    }

    @Transactional(readOnly = true)
    public ItemDto findByBarcode(UUID businessId, String barcode) {
        Item item = itemRepository.findByBusinessIdAndBarcode(businessId, barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with barcode: " + barcode));
        return itemMapper.toDto(item);
    }
}
