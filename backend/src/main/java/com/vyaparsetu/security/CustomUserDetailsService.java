package com.vyaparsetu.security;

import com.vyaparsetu.entity.business.BusinessUser;
import com.vyaparsetu.entity.user.Role;
import com.vyaparsetu.entity.user.User;
import com.vyaparsetu.repository.business.BusinessUserRepository;
import com.vyaparsetu.repository.user.RoleRepository;
import com.vyaparsetu.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final BusinessUserRepository businessUserRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (username == null || username.isBlank()) {
            throw new UsernameNotFoundException("Username is required");
        }
        String input = username.trim();
        if (input.contains("@")) {
            return userRepository.findByEmail(input.toLowerCase())
                    .map(this::buildUserDetails)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + input));
        }
        return userRepository.findByPhone(input)
                .map(this::buildUserDetails)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with phone: " + input));
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserByPhone(String phone) throws UsernameNotFoundException {
        if (phone == null || phone.isBlank()) {
            throw new UsernameNotFoundException("Phone is required");
        }
        User user = userRepository.findByPhone(phone.trim())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with phone: " + phone));
        return buildUserDetails(user);
    }

    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return email != null && userRepository.existsByEmail(email.trim().toLowerCase());
    }

    @Transactional(readOnly = true)
    public boolean existsByPhone(String phone) {
        if (phone == null) return false;
        return userRepository.existsByPhone(phone.trim());
    }

    private UserDetails buildUserDetails(User user) {
        List<BusinessUser> businessUsers = businessUserRepository.findByUserId(user.getId());
        Set<String> roles = businessUsers.stream()
                .map(BusinessUser::getRoleId)
                .map(roleId -> roleRepository.findById(roleId).orElse(null))
                .filter(r -> r != null)
                .map(r -> "ROLE_" + r.getName().name())
                .collect(Collectors.toSet());

        if (roles.isEmpty()) {
            roles = Set.of("ROLE_USER");
        }

        UUID businessId = businessUsers.isEmpty() ? null : businessUsers.get(0).getBusinessId();

        return CustomUserDetails.builder()
                .id(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .password(user.getPassword())
                .roles(List.copyOf(roles))
                .businessId(businessId)
                .enabled(Boolean.TRUE.equals(user.getIsActive()))
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .build();
    }
}
