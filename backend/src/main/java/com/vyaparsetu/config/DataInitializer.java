package com.vyaparsetu.config;

import com.vyaparsetu.entity.user.Role;
import com.vyaparsetu.entity.user.Role.RoleName;
import com.vyaparsetu.repository.user.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        if (roleRepository.count() > 0) return;
        log.info("Seeding base roles...");
        for (RoleName name : RoleName.values()) {
            Role role = new Role();
            role.setName(name);
            role.setDescription(name.name());
            roleRepository.save(role);
        }
        log.info("Seeded {} roles", RoleName.values().length);
    }
}
