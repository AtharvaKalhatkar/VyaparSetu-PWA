package com.vyaparsetu.service.item;

import com.vyaparsetu.common.AuditService;
import com.vyaparsetu.common.DuplicateResourceException;
import com.vyaparsetu.common.PagedResponse;
import com.vyaparsetu.common.ResourceNotFoundException;
import com.vyaparsetu.dto.item.CategoryCreateRequest;
import com.vyaparsetu.dto.item.CategoryDto;
import com.vyaparsetu.dto.mapper.CategoryMapper;
import com.vyaparsetu.entity.item.Category;
import com.vyaparsetu.repository.item.CategoryRepository;
import com.vyaparsetu.repository.item.ItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;
    private final CategoryMapper categoryMapper;
    private final AuditService auditService;

    @Transactional
    public CategoryDto createCategory(UUID businessId, CategoryCreateRequest request) {
        log.info("Creating category in business: {}", businessId);

        categoryRepository.findByBusinessIdAndName(businessId, request.getName())
                .ifPresent(c -> { throw new DuplicateResourceException("Category", "name", request.getName()); });

        if (request.getParentId() != null) {
            categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", request.getParentId()));
        }

        Category category = Category.builder()
                .businessId(businessId)
                .name(request.getName())
                .description(request.getDescription())
                .parentId(request.getParentId())
                .imageUrl(request.getImageUrl())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isActive(true)
                .build();
        category = categoryRepository.save(category);

        auditService.logEvent(businessId.toString(), "CREATE_CATEGORY", "Category", category.getId(),
                null, Map.of("name", category.getName()));

        return enrichWithItemCount(categoryMapper.toDto(category), businessId);
    }

    @Transactional
    public CategoryDto updateCategory(UUID businessId, UUID categoryId, CategoryCreateRequest request) {
        log.info("Updating category: {} in business: {}", categoryId, businessId);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));

        if (request.getName() != null && !request.getName().equals(category.getName())) {
            categoryRepository.findByBusinessIdAndName(businessId, request.getName())
                    .ifPresent(c -> { throw new DuplicateResourceException("Category", "name", request.getName()); });
            category.setName(request.getName());
        }
        if (request.getDescription() != null) category.setDescription(request.getDescription());
        if (request.getParentId() != null) category.setParentId(request.getParentId());
        if (request.getImageUrl() != null) category.setImageUrl(request.getImageUrl());
        if (request.getSortOrder() != null) category.setSortOrder(request.getSortOrder());

        category = categoryRepository.save(category);

        auditService.logEvent(businessId.toString(), "UPDATE_CATEGORY", "Category", categoryId,
                null, Map.of("name", category.getName()));

        return enrichWithItemCount(categoryMapper.toDto(category), businessId);
    }

    @Transactional
    public void deleteCategory(UUID businessId, UUID categoryId) {
        log.info("Deleting category: {} in business: {}", categoryId, businessId);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));
        category.setDeleted(true);
        categoryRepository.save(category);

        auditService.logEvent(businessId.toString(), "DELETE_CATEGORY", "Category", categoryId, null, null);
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(UUID businessId, UUID categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));
        return enrichWithItemCount(categoryMapper.toDto(category), businessId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CategoryDto> getCategoriesByBusiness(UUID businessId, Pageable pageable) {
        Page<Category> categoryPage = categoryRepository.findByBusinessId(businessId, pageable);
        List<CategoryDto> dtos = categoryMapper.toDtoList(categoryPage.getContent());
        dtos = dtos.stream().map(dto -> enrichWithItemCount(dto, businessId)).toList();
        return PagedResponse.of(dtos, pageable.getPageNumber(), pageable.getPageSize(),
                categoryPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories(UUID businessId) {
        List<Category> categories = categoryRepository.findByBusinessIdAndIsActiveTrue(businessId);
        List<CategoryDto> dtos = categoryMapper.toDtoList(categories);
        return dtos.stream().map(dto -> enrichWithItemCount(dto, businessId)).toList();
    }

    private CategoryDto enrichWithItemCount(CategoryDto dto, UUID businessId) {
        long count = itemRepository.findByBusinessIdAndCategoryId(
                businessId,
                dto.getId(),
                Pageable.unpaged()).getTotalElements();
        dto.setItemCount(count);
        return dto;
    }
}
