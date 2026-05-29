package ru.prod.buysell.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class ProductUpdateRequest {

    @Size(min = 3, max = 100)
    private String title;

    @Size(max = 1000)
    private String description;

    @DecimalMin(value = "0.0", inclusive = false, message = "Цена должна быть больше 0")
    private BigDecimal price;

    private Long cityId;

    @Size(max = 5, message = "Максимум 5 изображений")
    private List<MultipartFile> images;

    @Min(0)
    private Integer mainImageIndex;
}
