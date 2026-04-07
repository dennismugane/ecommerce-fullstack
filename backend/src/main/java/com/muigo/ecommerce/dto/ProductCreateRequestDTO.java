package com.muigo.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductCreateRequestDTO {

    private String sku;
    private String name;
    private String description;
    private Double price;
    private String image;

    // Optional defaults
    private Double rating = 0.0;
    private Integer ratingCount = 0;
}
