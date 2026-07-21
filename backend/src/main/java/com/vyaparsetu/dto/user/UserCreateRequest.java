package com.vyaparsetu.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateRequest {
    @Email
    private String email;
    @NotBlank
    private String phone;
    @NotBlank
    private String fullName;
    @NotBlank
    @Size(min = 6)
    private String password;
    private List<UUID> roleIds;
}
