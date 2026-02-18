package com.muigo.ecommerce.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Instant createdAt;
    private Instant updatedAt;

    private String status; // e.g., PENDING, COMPLETED, CANCELLED

    // One order has many cart items
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true,fetch = FetchType.LAZY)
    private List<CartItem> cartItems;

    @ManyToOne
    @JoinColumn(name = "delivery_option_id")  // FK column in `orders`
    private DeliveryOption deliveryOption;
}
