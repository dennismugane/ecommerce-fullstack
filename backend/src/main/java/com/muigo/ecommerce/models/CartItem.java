package com.muigo.ecommerce.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "cart_items")
@Getter
@Setter
@NoArgsConstructor
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many cart items can refer to one product
    @ManyToOne(fetch = FetchType.LAZY) // lazy loading is recommended
    @JoinColumn(name = "product_id", nullable = false) // foreign key column
    private Product product;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private OrderEntity order;
    private Integer quantity;

    private Instant createdAt;
    private Instant updatedAt;
    private boolean ordered = false; // new field

}
