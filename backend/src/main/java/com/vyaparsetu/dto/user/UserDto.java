package com.vyaparsetu.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String email;
    private String phone;
    private String fullName;
    private String displayName;
    private String avatar;
    private String language;
    private boolean isActive;
    private List<RoleDto> roles;
    private Instant createdAt;
}
