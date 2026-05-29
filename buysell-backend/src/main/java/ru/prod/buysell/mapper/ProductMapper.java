package ru.prod.buysell.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ru.prod.buysell.dto.ProductRequest;
import ru.prod.buysell.dto.ProductResponse;
import ru.prod.buysell.entity.Product;
import ru.prod.buysell.entity.ProductImage;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public abstract class ProductMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sellerId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "sold", ignore = true)
    public abstract Product toEntity(ProductRequest request);

    public abstract ProductResponse toResponse(Product product);

    public void fillImagePaths(ProductResponse response, List<ProductImage> images) {
        if (response != null) {
            List<Long> ids = (images != null)
                    ? images.stream()
                    .map(ProductImage::getId)
                    .collect(Collectors.toList())
                    : Collections.emptyList();
            response.setImageIds(ids);
        }
    }
}
