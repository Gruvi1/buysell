package ru.prod.buysell.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import ru.prod.buysell.dto.UserRegistrationRequest;
import ru.prod.buysell.dto.UserResponse;
import ru.prod.buysell.entity.User;

import java.util.List;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE // Игнорирует поля, которые не нужно мапить
)
public interface UserMapper {
    @Mapping(
            target = "imagePath",
            expression = "java(user.getAvatarId() != null ? \"/api/users/avatar/\" + user.getAvatarId() : null)"
    )
    UserResponse toResponse(User user);

    List<UserResponse> toResponseList(List<User> users);

    User toEntity(UserRegistrationRequest request);
}
