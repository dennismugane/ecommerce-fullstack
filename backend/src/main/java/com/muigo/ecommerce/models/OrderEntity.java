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
    private String status;

    // ── Link order to the user who placed it ──
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CartItem> cartItems;

    @ManyToOne
    @JoinColumn(name = "delivery_option_id")
    private DeliveryOption deliveryOption;
    @Column(nullable = false)
    private Double total;

    public void setItems(List<CartItem> cartItems) {
    }
}
