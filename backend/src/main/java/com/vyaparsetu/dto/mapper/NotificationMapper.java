package com.vyaparsetu.dto.mapper;

import com.vyaparsetu.dto.notification.NotificationDto;
import com.vyaparsetu.entity.notification.Notification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface NotificationMapper {

    @Mapping(target = "type", expression = "java(notification.getType() != null ? notification.getType().name() : null)")
    @Mapping(target = "channel", expression = "java(notification.getChannel() != null ? notification.getChannel().name() : null)")
    @Mapping(target = "status", expression = "java(notification.getStatus() != null ? notification.getStatus().name() : null)")
    NotificationDto toDto(Notification notification);

    List<NotificationDto> toDtoList(List<Notification> notifications);
}
