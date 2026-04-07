package com.muigo.ecommerce.dto;

import com.muigo.ecommerce.models.Product;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductDTO {
    Long id;
    String sku;
    String name;
    String description;
    Double price;
    String image;
    Double rating; // stars, e.g., 4.5
    Integer ratingCount; // number of reviews
    Instant createdAt;
    Instant updatedAt;

    public ProductDTO(Long id, String name, String description, Double price,
                      String image, Double rating, Integer ratingCount,
                      Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.image = image;
        this.rating = rating;
        this.ratingCount = ratingCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ProductDTO from(Product product) {
        return new ProductDTO(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getImage(), 
                product.getRating(),
                product.getRatingCount(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
