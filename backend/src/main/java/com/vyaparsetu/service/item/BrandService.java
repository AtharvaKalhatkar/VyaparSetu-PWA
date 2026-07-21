package com.vyaparsetu.service.item;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.DuplicateResourceException;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.item.BrandDto;
import com.vyaparsetu.dto.mapper.BrandMapper;
import com.vyaparsetu.entity.item.Brand;
import com.vyaparsetu.repository.item.BrandRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BrandService {

    private final BrandRepository brandRepository;
    private final BrandMapper brandMapper;
    private final AuditService auditService;

    @Transactional
    public BrandDto createBrand(UUID businessId, String name, String description, String imageUrl) {
        log.info("Creating brand in business: {}", businessId);

        brandRepository.findByBusinessIdAndName(businessId, name)
                .ifPresent(b -> { throw new DuplicateResourceException("Brand", "name", name); });

        Brand brand = Brand.builder()
                .businessId(businessId)
                .name(name)
                .description(description)
                .imageUrl(imageUrl)
                .isActive(true)
                .build();
        brand = brandRepository.save(brand);

        auditService.logEvent(businessId.toString(), "CREATE_BRAND", "Brand", brand.getId(),
                null, Map.of("name", brand.getName()));

        return brandMapper.toDto(brand);
    }

    @Transactional
    public BrandDto updateBrand(UUID businessId, UUID brandId, String name, String description, String imageUrl) {
        log.info("Updating brand: {} in business: {}", brandId, businessId);

        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", brandId));

        if (name != null && !name.equals(brand.getName())) {
            brandRepository.findByBusinessIdAndName(businessId, name)
                    .ifPresent(b -> { throw new DuplicateResourceException("Brand", "name", name); });
            brand.setName(name);
        }
        if (description != null) brand.setDescription(description);
        if (imageUrl != null) brand.setImageUrl(imageUrl);

        brand = brandRepository.save(brand);

        auditService.logEvent(businessId.toString(), "UPDATE_BRAND", "Brand", brandId,
                null, Map.of("name", brand.getName()));

        return brandMapper.toDto(brand);
    }

    @Transactional
    public void deleteBrand(UUID businessId, UUID brandId) {
        log.info("Deleting brand: {} in business: {}", brandId, businessId);

        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", brandId));
        brand.setDeleted(true);
        brandRepository.save(brand);

        auditService.logEvent(businessId.toString(), "DELETE_BRAND", "Brand", brandId, null, null);
    }

    @Transactional(readOnly = true)
    public BrandDto getBrandById(UUID businessId, UUID brandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Brand", brandId));
        return brandMapper.toDto(brand);
    }

    @Transactional(readOnly = true)
    public PagedResponse<BrandDto> getBrandsByBusiness(UUID businessId, Pageable pageable) {
        Page<Brand> brandPage = brandRepository.findByBusinessId(businessId, pageable);
        List<BrandDto> dtos = brandMapper.toDtoList(brandPage.getContent());
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                brandPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<BrandDto> getAllBrands(UUID businessId) {
        List<Brand> brands = brandRepository.findByBusinessIdAndIsActiveTrue(businessId);
        return brandMapper.toDtoList(brands);
    }
}
