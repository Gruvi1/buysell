package ru.prod.buysell.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.prod.buysell.entity.Dialog;

import java.util.List;
import java.util.Optional;

public interface DialogRepository extends JpaRepository<Dialog, Long> {

    Optional<Dialog> findByProductIdAndBuyerId(Long productId, Long buyerId);

    @Query("SELECT d FROM Dialog d WHERE d.buyerId = :buyerId ORDER BY d.updatedAt DESC")
    List<Dialog> findByBuyerIdOrderByUpdatedAtDesc(@Param("buyerId") Long buyerId);

    @Query("SELECT d FROM Dialog d WHERE d.productId IN " +
            "(SELECT p.id FROM Product p WHERE p.sellerId = :sellerId) " +
            "ORDER BY d.updatedAt DESC")
    List<Dialog> findByProductSellerIdOrderByUpdatedAtDesc(@Param("sellerId") Long sellerId);
}