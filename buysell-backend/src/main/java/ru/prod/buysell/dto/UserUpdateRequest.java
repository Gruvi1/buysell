package ru.prod.buysell.dto;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class UserUpdateRequest {
    @Size(min = 2, max = 50)
    private String displayName;

    @Pattern(regexp = "^\\+?[78][-(]?\\d{3}\\)?-?\\d{3}-?\\d{2}-?\\d{2}$",
            message = "Некорректный формат номера телефона")
    private String phoneNumber;

    private MultipartFile avatar;
}
