package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.user.RoleDto;
import com.vyaparsetu.dto.user.UserDto;
import com.vyaparsetu.dto.user.UserCreateRequest;
import com.vyaparsetu.entity.user.Role;
import com.vyaparsetu.entity.user.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;
import java.util.Set;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    @Mapping(target = "roles", source = "roles")
    UserDto toDto(User user);

    @Mapping(target = "password", source = "password")
    @Mapping(target = "roles", ignore = true)
    User toEntity(UserCreateRequest request);

    List<UserDto> toDtoList(List<User> users);

    default List<RoleDto> mapRoles(Set<Role> roles) {
        if (roles == null) return List.of();
        return roles.stream().map(this::roleToDto).toList();
    }

    @Mapping(target = "name", expression = "java(role.getName() != null ? role.getName().name() : null)")
    @Mapping(target = "permissions", ignore = true)
    RoleDto roleToDto(Role role);
}
