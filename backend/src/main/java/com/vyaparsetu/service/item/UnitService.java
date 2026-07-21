package com.vyaparsetu.service.item;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.DuplicateResourceException;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.item.UnitDto;
import com.vyaparsetu.dto.mapper.UnitMapper;
import com.vyaparsetu.entity.item.Unit;
import com.vyaparsetu.entity.item.Unit.UnitType;
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
public class UnitService {

    private final UnitRepository unitRepository;
    private final UnitMapper unitMapper;
    private final AuditService auditService;

    @Transactional
    public UnitDto createUnit(UUID businessId, String name, String shortName,
                               UUID baseUnitId, BigDecimal conversionFactor, String unitType) {
        log.info("Creating unit in business: {}", businessId);

        unitRepository.findByBusinessIdAndShortName(businessId, shortName)
                .ifPresent(u -> { throw new DuplicateResourceException("Unit", "shortName", shortName); });

        Unit unit = Unit.builder()
                .businessId(businessId)
                .name(name)
                .shortName(shortName)
                .baseUnitId(baseUnitId)
                .conversionFactor(conversionFactor != null ? conversionFactor : BigDecimal.ONE)
                .unitType(unitType != null ? UnitType.valueOf(unitType) : UnitType.COUNT)
                .build();
        unit = unitRepository.save(unit);

        auditService.logEvent(businessId.toString(), "CREATE_UNIT", "Unit", unit.getId(),
                null, Map.of("name", unit.getName(), "shortName", unit.getShortName()));

        return unitMapper.toDto(unit);
    }

    @Transactional
    public UnitDto updateUnit(UUID businessId, UUID unitId, String name, String shortName,
                               UUID baseUnitId, BigDecimal conversionFactor, String unitType) {
        log.info("Updating unit: {} in business: {}", unitId, businessId);

        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Unit", unitId));

        if (shortName != null && !shortName.equals(unit.getShortName())) {
            unitRepository.findByBusinessIdAndShortName(businessId, shortName)
                    .ifPresent(u -> { throw new DuplicateResourceException("Unit", "shortName", shortName); });
            unit.setShortName(shortName);
        }
        if (name != null) unit.setName(name);
        if (baseUnitId != null) unit.setBaseUnitId(baseUnitId);
        if (conversionFactor != null) unit.setConversionFactor(conversionFactor);
        if (unitType != null) unit.setUnitType(UnitType.valueOf(unitType));

        unit = unitRepository.save(unit);

        auditService.logEvent(businessId.toString(), "UPDATE_UNIT", "Unit", unitId,
                null, Map.of("name", unit.getName()));

        return unitMapper.toDto(unit);
    }

    @Transactional
    public void deleteUnit(UUID businessId, UUID unitId) {
        log.info("Deleting unit: {} in business: {}", unitId, businessId);

        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Unit", unitId));
        unit.setDeleted(true);
        unitRepository.save(unit);

        auditService.logEvent(businessId.toString(), "DELETE_UNIT", "Unit", unitId, null, null);
    }

    @Transactional(readOnly = true)
    public UnitDto getUnitById(UUID businessId, UUID unitId) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Unit", unitId));
        return unitMapper.toDto(unit);
    }

    @Transactional(readOnly = true)
    public PagedResponse<UnitDto> getUnitsByBusiness(UUID businessId, Pageable pageable) {
        Page<Unit> unitPage = unitRepository.findByBusinessId(businessId, pageable);
        List<UnitDto> dtos = unitMapper.toDtoList(unitPage.getContent());
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                unitPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<UnitDto> getAllUnits(UUID businessId) {
        List<Unit> units = unitRepository.findByBusinessIdAndIsActiveTrue(businessId);
        return unitMapper.toDtoList(units);
    }
}
