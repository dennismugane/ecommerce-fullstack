package com.muigo.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductUpdateRequestDTO {
    private String name;
    private String description;
    private Double price;
    private String image;
}
