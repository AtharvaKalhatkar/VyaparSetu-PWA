package com.vyaparsetu.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String email;
    @NotBlank
    private String phone;
    @NotBlank
    private String fullName;
    @NotBlank
    @Size(min = 6)
    private String password;
    @NotBlank
    private String businessName;
    private String businessType;
    private String deviceId;
}
