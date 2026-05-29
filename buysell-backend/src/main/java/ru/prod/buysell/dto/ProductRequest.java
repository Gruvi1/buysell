package ru.prod.buysell.dto;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.*;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class ProductRequest {

    @NotBlank(message = "Название обязательно")
    @Size(min = 3, max = 100)
    private String title;

    @Size(max = 1000)
    private String description;

    @NotNull(message = "Цена обязательна")
    @DecimalMin(value = "0.0", inclusive = false, message = "Цена должна быть больше 0")
    private BigDecimal price;

    @NotNull(message = "ID города обязателен")
    private Long cityId;

    @NotEmpty(message = "Загрузите хотя бы одно изображение")
    @Size(max = 5, message = "Максимум 5 изображений")
    private List<MultipartFile> images;

    @Min(0)
    private Integer mainImageIndex;
}