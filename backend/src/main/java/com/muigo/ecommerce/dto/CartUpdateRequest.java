package com.muigo.ecommerce.dto;

import lombok.Data;

@Data
public class CartUpdateRequest {
    private Integer quantity;          // optional update
    private Long  deliveryOptionId;   // optional update
}

