package com.vyaparsetu.service.business;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.BadRequestException;
import com.vyaparsetu.common.DuplicateResourceException;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.business.BusinessConfigDto;
import com.vyaparsetu.dto.business.BusinessCreateRequest;
import com.vyaparsetu.dto.business.BusinessDto;
import com.vyaparsetu.dto.business.BusinessSettingsDto;
import com.vyaparsetu.dto.business.BusinessUpdateRequest;
import com.vyaparsetu.dto.mapper.BusinessMapper;
import com.vyaparsetu.entity.business.Business;
import com.vyaparsetu.entity.business.BusinessUser;
import com.vyaparsetu.entity.business.FinancialYear;
import com.vyaparsetu.entity.user.Role;
import com.vyaparsetu.entity.user.Role.RoleName;
import com.vyaparsetu.repository.business.BusinessRepository;
import com.vyaparsetu.repository.business.BusinessUserRepository;
import com.vyaparsetu.repository.business.FinancialYearRepository;
import com.vyaparsetu.repository.user.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.MonthDay;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class BusinessService {

    private final BusinessRepository businessRepository;
    private final BusinessUserRepository businessUserRepository;
    private final FinancialYearRepository financialYearRepository;
    private final RoleRepository roleRepository;
    private final BusinessMapper businessMapper;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;

    private static final Pattern GSTIN_PATTERN =
            Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$");

    @Transactional
    public BusinessDto createBusiness(BusinessCreateRequest request, UUID ownerId) {
        log.info("Creating business for owner: {}", ownerId);

        if (request.getGstin() != null && !request.getGstin().isBlank()) {
            businessRepository.findByGstin(request.getGstin()).ifPresent(b -> {
                throw new DuplicateResourceException("Business", "gstin", request.getGstin());
            });
        }

        Business business = Business.builder()
                .name(request.getName())
                .businessType(request.getBusinessType() != null ? request.getBusinessType() : "RETAIL")
                .gstin(request.getGstin())
                .pan(request.getPan())
                .addressLine1(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .phone(request.getPhone())
                .email(request.getEmail())
                .isActive(true)
                .financialYearStart(MonthDay.of(4, 1))
                .financialYearEnd(MonthDay.of(3, 31))
                .build();

        if (request.getConfig() != null) {
            try {
                business.setConfig(objectMapper.writeValueAsString(request.getConfig()));
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize business config: {}", e.getMessage());
            }
        }

        business = businessRepository.save(business);

        Role ownerRole = roleRepository.findByName(RoleName.OWNER)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "OWNER"));

        BusinessUser businessUser = BusinessUser.builder()
                .userId(ownerId)
                .businessId(business.getId())
                .roleId(ownerRole.getId())
                .isActive(true)
                .joinedAt(Instant.now())
                .build();
        businessUserRepository.save(businessUser);

        FinancialYear financialYear = FinancialYear.builder()
                .businessId(business.getId())
                .yearStart(LocalDate.of(LocalDate.now().getMonthValue() >= 4 ?
                        LocalDate.now().getYear() : LocalDate.now().getYear() - 1, 4, 1))
                .yearEnd(LocalDate.of(LocalDate.now().getMonthValue() >= 4 ?
                        LocalDate.now().getYear() + 1 : LocalDate.now().getYear(), 3, 31))
                .name("FY " + (LocalDate.now().getMonthValue() >= 4 ?
                        LocalDate.now().getYear() + "-" + (LocalDate.now().getYear() + 1) :
                        (LocalDate.now().getYear() - 1) + "-" + LocalDate.now().getYear()))
                .isCurrent(true)
                .build();
        financialYearRepository.save(financialYear);

        auditService.logEvent(business.getId().toString(), "CREATE_BUSINESS", "Business",
                business.getId(), null, Map.of("name", business.getName()));

        return businessMapper.toDto(business);
    }

    @Transactional
    public BusinessDto updateBusiness(UUID businessId, BusinessUpdateRequest request) {
        log.info("Updating business: {}", businessId);

        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business", businessId));

        if (request.getName() != null) business.setName(request.getName());
        if (request.getBusinessType() != null) business.setBusinessType(request.getBusinessType());
        if (request.getGstin() != null) {
            if (!business.getGstin().equals(request.getGstin())) {
                businessRepository.findByGstin(request.getGstin()).ifPresent(b -> {
                    throw new DuplicateResourceException("Business", "gstin", request.getGstin());
                });
            }
            business.setGstin(request.getGstin());
        }
        if (request.getPan() != null) business.setPan(request.getPan());
        if (request.getAddressLine1() != null) business.setAddressLine1(request.getAddressLine1());
        if (request.getAddressLine2() != null) business.setAddressLine2(request.getAddressLine2());
        if (request.getCity() != null) business.setCity(request.getCity());
        if (request.getState() != null) business.setState(request.getState());
        if (request.getPincode() != null) business.setPincode(request.getPincode());
        if (request.getPhone() != null) business.setPhone(request.getPhone());
        if (request.getEmail() != null) business.setEmail(request.getEmail());
        if (request.getWebsite() != null) business.setWebsite(request.getWebsite());
        if (request.getLogo() != null) business.setLogo(request.getLogo());
        if (request.getIsGstEnabled() != null) business.setGstEnabled(request.getIsGstEnabled());

        if (request.getConfig() != null) {
            try {
                business.setConfig(objectMapper.writeValueAsString(request.getConfig()));
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize config: {}", e.getMessage());
            }
        }
        if (request.getSettings() != null) {
            try {
                business.setSettings(objectMapper.writeValueAsString(request.getSettings()));
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize settings: {}", e.getMessage());
            }
        }

        business = businessRepository.save(business);

        auditService.logEvent(businessId.toString(), "UPDATE_BUSINESS", "Business", businessId,
                null, Map.of("name", business.getName()));

        return businessMapper.toDto(business);
    }

    @Transactional(readOnly = true)
    public List<FinancialYear> getFinancialYears(UUID businessId) {
        return financialYearRepository.findByBusinessId(businessId);
    }

    @Transactional(readOnly = true)
    public BusinessDto getBusinessById(UUID businessId) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business", businessId));
        return businessMapper.toDto(business);
    }

    @Transactional(readOnly = true)
    public List<BusinessDto> getUserBusinesses(UUID userId) {
        List<BusinessUser> businessUsers = businessUserRepository.findByUserId(userId);
        List<UUID> businessIds = businessUsers.stream()
                .filter(BusinessUser::getIsActive)
                .map(BusinessUser::getBusinessId)
                .toList();
        List<Business> businesses = businessRepository.findAllById(businessIds);
        return businessMapper.toDtoList(businesses);
    }

    @Transactional
    public void updateSettings(UUID businessId, BusinessSettingsDto settingsDto) {
        log.info("Updating settings for business: {}", businessId);

        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business", businessId));

        try {
            business.setSettings(objectMapper.writeValueAsString(settingsDto));
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Failed to serialize settings");
        }
        businessRepository.save(business);
    }

    @Transactional
    public void updateConfig(UUID businessId, BusinessConfigDto configDto) {
        log.info("Updating config for business: {}", businessId);

        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business", businessId));

        try {
            business.setConfig(objectMapper.writeValueAsString(configDto));
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Failed to serialize config");
        }
        businessRepository.save(business);
    }

    public boolean validateGstin(String gstin) {
        if (gstin == null || gstin.isBlank()) return false;
        return GSTIN_PATTERN.matcher(gstin.toUpperCase()).matches();
    }

    @Transactional
    public FinancialYear createFinancialYear(UUID businessId, FinancialYear financialYear) {
        log.info("Creating financial year for business: {}", businessId);

        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business", businessId));

        financialYear.setBusinessId(businessId);
        financialYear.setCurrent(true);

        List<FinancialYear> existing = financialYearRepository.findByBusinessId(businessId);
        for (FinancialYear fy : existing) {
            fy.setCurrent(false);
            financialYearRepository.save(fy);
        }

        FinancialYear saved = financialYearRepository.save(financialYear);

        auditService.logEvent(businessId.toString(), "CREATE_FINANCIAL_YEAR", "FinancialYear",
                saved.getId(), null, Map.of("name", saved.getName()));

        return saved;
    }
}
