package com.vyaparsetu.repository.user;

import com.vyaparsetu.entity.user.DeviceRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceRegistrationRepository extends JpaRepository<DeviceRegistration, UUID>, JpaSpecificationExecutor<DeviceRegistration> {

    List<DeviceRegistration> findByUserId(UUID userId);

    Optional<DeviceRegistration> findByDeviceId(String deviceId);

    List<DeviceRegistration> findByUserIdAndIsActiveTrue(UUID userId);

    Optional<DeviceRegistration> findByUserIdAndDeviceId(UUID userId, String deviceId);
}
