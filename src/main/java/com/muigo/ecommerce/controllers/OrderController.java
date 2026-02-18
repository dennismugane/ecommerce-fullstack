package com.muigo.ecommerce.controllers;

import com.muigo.ecommerce.dto.OrderDTO;
import com.muigo.ecommerce.dto.OrderUpdateDTO;
import com.muigo.ecommerce.models.DeliveryOption;
import com.muigo.ecommerce.models.OrderEntity;
import com.muigo.ecommerce.repositories.DeliveryOptionRepository;
import com.muigo.ecommerce.repositories.OrderRepository;
import com.muigo.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;
    private final OrderRepository repo;
    private final DeliveryOptionRepository deliveryOptionRepo;



    @GetMapping
    public List<OrderDTO> all(@RequestParam(required = false) String expand) {

        boolean expandProduct =
                "product".equals(expand) || "products".equals(expand);

        return repo.findAll().stream()
                .map(order -> OrderDTO.from(order, expandProduct))
                .toList();
    }



    @PostMapping
    public ResponseEntity<?> createOrder() {
        OrderDTO order = orderService.createFromCart();
        if (order == null) {
            return ResponseEntity
                    .badRequest()
                    .body("Cart is empty");
        }
        return ResponseEntity.ok(order);
    }
    @PutMapping("/{orderId}")
    public ResponseEntity<?> updateOrder(
            @PathVariable Long orderId, @RequestBody OrderUpdateDTO req) {

        OrderEntity order = repo.findById(orderId).orElse(null);

        if (order == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");
        if(req.getDeliveryOptionId() == null){
            return ResponseEntity.badRequest().body("Delivery option ID is required");
        }
        DeliveryOption option = deliveryOptionRepo.findById(req.getDeliveryOptionId())
                .orElse(null);
        if(option == null)
            return ResponseEntity.badRequest().body("invalid Delivery option ID");

        order.setDeliveryOption(option);
        order.setUpdatedAt(Instant.now());
        repo.save(order);
        return ResponseEntity.ok(OrderDTO.from(order,true));
    }
}
