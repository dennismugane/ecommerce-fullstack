package com.muigo.ecommerce.repositories;

import com.muigo.ecommerce.models.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    @Query("SELECT o FROM OrderEntity o JOIN FETCH o.cartItems ci JOIN FETCH ci.product WHERE o.id = :id")
    Optional<OrderEntity> findByIdWithItemsAndProducts(@Param("id") Long id);
}
