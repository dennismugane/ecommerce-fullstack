package com.muigo.ecommerce.repositories;

import com.muigo.ecommerce.models.CartItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    // Find cart item by the product's ID
    @EntityGraph(attributePaths = {"product"})
    Optional<CartItem> findByProduct_Id(Long productId);
    @EntityGraph(attributePaths = {"product"})
    Optional<CartItem> findByProduct_IdAndOrderedFalse(Long productId);


    // This fetches the product eagerly when needed
    @EntityGraph(attributePaths = {"product"})
    @Query("SELECT c FROM CartItem c")   // simple JPQL that selects all CartItem
    List<CartItem> findAllWithProduct();

    // Optional: override findAll with graph if you want
    @Override
    @EntityGraph(attributePaths = {"product"})
    List<CartItem> findAll();

    List<CartItem> findByOrderedFalse();

}
