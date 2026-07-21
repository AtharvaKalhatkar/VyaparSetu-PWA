package com.vyaparsetu.repository.notification;

import com.vyaparsetu.entity.notification.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID>, JpaSpecificationExecutor<Notification> {

    Page<Notification> findByBusinessId(UUID businessId, Pageable pageable);

    Page<Notification> findByUserId(UUID userId, Pageable pageable);

    Page<Notification> findByBusinessIdAndUserId(UUID businessId, UUID userId, Pageable pageable);

    List<Notification> findByBusinessIdAndUserIdAndIsReadFalse(UUID businessId, UUID userId);

    long countByBusinessIdAndUserIdAndIsReadFalse(UUID businessId, UUID userId);
}
