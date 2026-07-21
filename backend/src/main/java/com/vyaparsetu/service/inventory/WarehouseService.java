package com.vyaparsetu.service.inventory;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.DuplicateResourceException;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.inventory.WarehouseCreateRequest;
import com.vyaparsetu.dto.inventory.WarehouseDto;
import com.vyaparsetu.dto.mapper.WarehouseMapper;
import com.vyaparsetu.entity.inventory.Warehouse;
import com.vyaparsetu.repository.inventory.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final WarehouseMapper warehouseMapper;
    private final AuditService auditService;

    @Transactional
    public WarehouseDto createWarehouse(UUID businessId, WarehouseCreateRequest request) {
        log.info("Creating warehouse in business: {}", businessId);

        warehouseRepository.findByBusinessIdAndCode(businessId, request.getCode())
                .ifPresent(w -> { throw new DuplicateResourceException("Warehouse", "code", request.getCode()); });

        boolean isPrimary = request.getIsPrimary() != null && request.getIsPrimary();
        if (isPrimary) {
            Optional<Warehouse> primary = warehouseRepository.findByBusinessIdAndIsPrimaryTrue(businessId);
            primary.ifPresent(p -> {
                p.setPrimary(false);
                warehouseRepository.save(p);
            });
        }

        Warehouse warehouse = Warehouse.builder()
                .businessId(businessId)
                .name(request.getName())
                .code(request.getCode())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .isActive(true)
                .isPrimary(isPrimary)
                .build();
        warehouse = warehouseRepository.save(warehouse);

        auditService.logEvent(businessId.toString(), "CREATE_WAREHOUSE", "Warehouse", warehouse.getId(),
                null, Map.of("name", warehouse.getName(), "code", warehouse.getCode()));

        return warehouseMapper.toDto(warehouse);
    }

    @Transactional
    public WarehouseDto updateWarehouse(UUID businessId, UUID warehouseId, WarehouseCreateRequest request) {
        log.info("Updating warehouse: {} in business: {}", warehouseId, businessId);

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", warehouseId));

        if (request.getCode() != null && !request.getCode().equals(warehouse.getCode())) {
            warehouseRepository.findByBusinessIdAndCode(businessId, request.getCode())
                    .ifPresent(w -> { throw new DuplicateResourceException("Warehouse", "code", request.getCode()); });
            warehouse.setCode(request.getCode());
        }
        if (request.getName() != null) warehouse.setName(request.getName());
        if (request.getAddress() != null) warehouse.setAddress(request.getAddress());
        if (request.getCity() != null) warehouse.setCity(request.getCity());
        if (request.getState() != null) warehouse.setState(request.getState());

        if (request.getIsPrimary() != null && request.getIsPrimary() && !warehouse.isPrimary()) {
            Optional<Warehouse> primary = warehouseRepository.findByBusinessIdAndIsPrimaryTrue(businessId);
            primary.ifPresent(p -> {
                p.setPrimary(false);
                warehouseRepository.save(p);
            });
            warehouse.setPrimary(true);
        }

        warehouse = warehouseRepository.save(warehouse);

        auditService.logEvent(businessId.toString(), "UPDATE_WAREHOUSE", "Warehouse", warehouseId,
                null, Map.of("name", warehouse.getName()));

        return warehouseMapper.toDto(warehouse);
    }

    @Transactional
    public void deleteWarehouse(UUID businessId, UUID warehouseId) {
        log.info("Deleting warehouse: {} in business: {}", warehouseId, businessId);

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", warehouseId));
        warehouse.setDeleted(true);
        warehouseRepository.save(warehouse);

        auditService.logEvent(businessId.toString(), "DELETE_WAREHOUSE", "Warehouse", warehouseId, null, null);
    }

    @Transactional(readOnly = true)
    public WarehouseDto getWarehouseById(UUID businessId, UUID warehouseId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", warehouseId));
        return warehouseMapper.toDto(warehouse);
    }

    @Transactional(readOnly = true)
    public PagedResponse<WarehouseDto> getWarehousesByBusiness(UUID businessId, Pageable pageable) {
        Page<Warehouse> warehousePage = warehouseRepository.findByBusinessId(businessId, pageable);
        List<WarehouseDto> dtos = warehouseMapper.toDtoList(warehousePage.getContent());
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                warehousePage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<WarehouseDto> getAllWarehouses(UUID businessId) {
        List<Warehouse> warehouses = warehouseRepository.findByBusinessIdAndIsActiveTrue(businessId);
        return warehouseMapper.toDtoList(warehouses);
    }
}
