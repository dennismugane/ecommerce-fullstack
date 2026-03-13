package com.muigo.ecommerce.repositories;

import com.muigo.ecommerce.models.CartItem;
import com.muigo.ecommerce.models.UserEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    // ── User-scoped queries (use these everywhere) ──

    @EntityGraph(attributePaths = {"product"})
    List<CartItem> findByUserAndOrderedFalse(UserEntity user);

    @EntityGraph(attributePaths = {"product"})
    Optional<CartItem> findByProduct_IdAndOrderedFalseAndUser(Long productId, UserEntity user);

    // ── Legacy queries (kept for DataLoader/seeding only) ──

    @EntityGraph(attributePaths = {"product"})
    Optional<CartItem> findByProduct_IdAndOrderedFalse(Long productId);

    List<CartItem> findByOrderedFalse();
}
