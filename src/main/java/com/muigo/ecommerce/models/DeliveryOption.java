package com.muigo.ecommerce.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Table(name = "delivery_options")
@Getter
@Setter
@NoArgsConstructor
public class DeliveryOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    private String name;      // e.g. "Standard", "Express"
    private double cost;      // e.g. 4.99
    private int days;         // delivery days
}
