package com.muigo.ecommerce.dto;

import com.muigo.ecommerce.models.CartItem;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class OrderItemDTO {

    private Long id;
    private int quantity;
    private ProductDTO product; // nullable
    private  Instant deliveryDate; // New field

    public OrderItemDTO(Long id, int quantity, ProductDTO product, Instant deliveryDate) {
        this.id = id;
        this.quantity = quantity;
        this.product = product;
        this.deliveryDate = deliveryDate;
    }

    public static OrderItemDTO from(CartItem item, boolean expandProduct,Instant deliveryDate) {
        return new OrderItemDTO(
                item.getId(),
                item.getQuantity(),
                expandProduct ? ProductDTO.from(item.getProduct()) : null,
                deliveryDate
        );
    }
}
