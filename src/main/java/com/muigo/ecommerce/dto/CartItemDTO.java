package com.muigo.ecommerce.dto;

import com.muigo.ecommerce.models.CartItem;
import com.muigo.ecommerce.models.Product;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CartItemDTO {
    private Long id;
    private Long productId;
    private Integer quantity;
    private ProductDTO product; // only when expand=product

    public static CartItemDTO from(CartItem item) {
        Long productId = item.getProduct() != null ? item.getProduct().getId() : null;
        return new CartItemDTO(
                item.getId(),
                productId,
                item.getQuantity(),
                null
        );
    }

    public static CartItemDTO from(CartItem item, Product product) {
        return new CartItemDTO(
                item.getId(),
                item.getProduct().getId(),
                item.getQuantity(),
                ProductDTO.from(product)
        );
    }
}

