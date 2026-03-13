package com.muigo.ecommerce.service;

import com.muigo.ecommerce.config.SecurityUtil;
import com.muigo.ecommerce.dto.OrderDTO;
import com.muigo.ecommerce.models.CartItem;
import com.muigo.ecommerce.models.OrderEntity;
import com.muigo.ecommerce.models.UserEntity;
import com.muigo.ecommerce.repositories.CartItemRepository;
import com.muigo.ecommerce.repositories.OrderRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final CartItemRepository cartItemRepo;
    private final OrderRepository orderRepo;
    private final SecurityUtil securityUtil;

    @Transactional
    public OrderDTO createFromCart() {
        UserEntity user = securityUtil.getCurrentUser();
        List<CartItem> cartItems = cartItemRepo.findByUserAndOrderedFalse(user);

        if (cartItems.isEmpty()) return null;

        // Calculate total to satisfy DB not-null constraint
        double productCost = cartItems.stream()
                .mapToDouble(item -> item.getProduct().getPrice() * item.getQuantity())
                .sum();
        double tax = Math.round(productCost * 0.1 * 100.0) / 100.0;
        double total = productCost + tax;

        OrderEntity order = new OrderEntity();
        order.setUser(user);
        order.setStatus("PENDING");
        order.setTotal(total); // ✅ satisfies not-null constraint
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        order = orderRepo.save(order);

        for (CartItem item : cartItems) {
            item.setOrder(order);
            item.setOrdered(true);
        }
        cartItemRepo.saveAll(cartItems);
        order.setItems(cartItems);

        return OrderDTO.from(order, true);
    }
}