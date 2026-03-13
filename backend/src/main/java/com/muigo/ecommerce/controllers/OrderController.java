package com.muigo.ecommerce.controllers;

import com.muigo.ecommerce.config.SecurityUtil;
import com.muigo.ecommerce.dto.OrderDTO;
import com.muigo.ecommerce.dto.OrderUpdateDTO;
import com.muigo.ecommerce.models.DeliveryOption;
import com.muigo.ecommerce.models.OrderEntity;
import com.muigo.ecommerce.models.UserEntity;
import com.muigo.ecommerce.repositories.DeliveryOptionRepository;
import com.muigo.ecommerce.repositories.OrderRepository;
import com.muigo.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository repo;
    private final DeliveryOptionRepository deliveryOptionRepo;
    private final SecurityUtil securityUtil;

    // GET — current user's orders only
    @GetMapping
    public List<OrderDTO> getMyOrders(@RequestParam(required = false) String expand) {
        UserEntity user = securityUtil.getCurrentUser();
        boolean expandProduct = "product".equals(expand) || "products".equals(expand);
        return repo.findByUser(user).stream()
                .map(order -> OrderDTO.from(order, expandProduct))
                .toList();
    }


    @PostMapping
    public ResponseEntity<?> createOrder() {
        OrderDTO order = orderService.createFromCart();
        if (order == null) return ResponseEntity.badRequest().body("Cart is empty");
        return ResponseEntity.ok(order);
    }

    // PUT — update delivery option (user's own order)
    @PutMapping("/{orderId}")
    public ResponseEntity<?> updateOrder(@PathVariable Long orderId, @RequestBody OrderUpdateDTO req) {
        UserEntity user = securityUtil.getCurrentUser();
        OrderEntity order = repo.findByIdAndUser(orderId, user).orElse(null);

        if (order == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");
        if (req.getDeliveryOptionId() == null) return ResponseEntity.badRequest().body("Delivery option ID is required");

        DeliveryOption option = deliveryOptionRepo.findById(req.getDeliveryOptionId()).orElse(null);
        if (option == null) return ResponseEntity.badRequest().body("Invalid delivery option ID");

        order.setDeliveryOption(option);
        order.setUpdatedAt(Instant.now());
        repo.save(order);
        return ResponseEntity.ok(OrderDTO.from(order, true));
    }

    // PATCH /api/orders/{orderId}/status — ADMIN only
    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long orderId, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        List<String> valid = List.of("PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED");

        if (newStatus == null || !valid.contains(newStatus))
            return ResponseEntity.badRequest().body("Invalid status. Must be: " + valid);

        OrderEntity order = repo.findById(orderId).orElse(null);
        if (order == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");

        order.setStatus(newStatus);
        order.setUpdatedAt(Instant.now());
        repo.save(order);
        return ResponseEntity.ok(OrderDTO.from(order, true));
    }
}
