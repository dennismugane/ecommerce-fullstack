package com.muigo.ecommerce.repositories;

import com.muigo.ecommerce.models.OrderEntity;
import com.muigo.ecommerce.models.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    // ── User-scoped queries ──
    List<OrderEntity> findByUser(UserEntity user);

    Optional<OrderEntity> findByIdAndUser(Long id, UserEntity user);

    @Query("SELECT o FROM OrderEntity o JOIN FETCH o.cartItems ci JOIN FETCH ci.product WHERE o.id = :id AND o.user = :user")
    Optional<OrderEntity> findByIdWithItemsAndProducts(@Param("id") Long id, @Param("user") UserEntity user);
}
