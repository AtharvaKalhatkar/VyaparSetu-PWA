package com.vyaparsetu.repository.user;

import com.vyaparsetu.entity.user.Role;
import com.vyaparsetu.entity.user.Role.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID>, JpaSpecificationExecutor<Role> {

    Optional<Role> findByName(RoleName name);

    boolean existsByName(RoleName name);
}
