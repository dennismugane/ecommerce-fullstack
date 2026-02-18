package com.muigo.ecommerce.service;

import com.muigo.ecommerce.dto.OrderDTO;
import com.muigo.ecommerce.models.CartItem;
import com.muigo.ecommerce.models.OrderEntity;
import com.muigo.ecommerce.repositories.CartItemRepository;
import com.muigo.ecommerce.repositories.OrderRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class OrderService {
    private final CartItemRepository cartItemRepo;
    private final OrderRepository orderRepo;

    public OrderService(CartItemRepository cartItemRepo, OrderRepository orderRepo) {
        this.cartItemRepo = cartItemRepo;
        this.orderRepo = orderRepo;
    }

    @Transactional
    public OrderDTO createFromCart(){
        List<CartItem> cartItems = cartItemRepo.findByOrderedFalse();

        if (cartItems.isEmpty()){
            return null;
        }
        OrderEntity order  = new OrderEntity();
        order.setCreatedAt(Instant.now());
        order.setStatus("PENDING");
        order.setUpdatedAt(Instant.now());
        for (CartItem cartItem : cartItems) {
            cartItem.setOrder(order);
            cartItem.setOrdered(true);    // mark as ordered
        }
        order.setCartItems(cartItems);

        OrderEntity savedOrder = orderRepo.save(order);

        // Map to DTO **before deleting cart items**

        // Now clear the cart
       //cartItemRepo.deleteAllInBatch();

        return OrderDTO.from(savedOrder, true);
    }
}
