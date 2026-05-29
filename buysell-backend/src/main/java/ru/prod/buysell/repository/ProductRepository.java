package ru.prod.buysell.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.prod.buysell.entity.Product;

import java.math.BigDecimal;

public interface ProductRepository extends JpaRepository<Product, Long> {
    @Query("""
            select p from Product p where p.sold = false
                and (cast(:title as string) is null or lower(p.title) like lower(concat('%', cast(:title as string), '%')))
                and (:cityId is null or p.cityId = :cityId)
                and (:minPrice is null or p.price >= :minPrice)
                and (:maxPrice is null or p.price <= :maxPrice)
            """)
    Page<Product> findAllWithFilters(@Param("title") String title, @Param("cityId") Long cityId,
                                     @Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice,
                                     Pageable pageable);

    @Modifying
    @Query("update Product p set p.sold = true where p.id = :id")
    void softDeleteById(@Param("id") Long id);
}