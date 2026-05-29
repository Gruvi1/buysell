package ru.prod.buysell.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.prod.buysell.entity.ProductImage;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductId(Long productId);

    void deleteByProductId(Long productId);
}
