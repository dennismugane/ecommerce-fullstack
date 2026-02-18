package com.muigo.ecommerce.dto;

import com.muigo.ecommerce.models.OrderEntity;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
@Data
@NoArgsConstructor
public class OrderDTO {
    private Long id;
    private String status;
    private Instant createdAt;

    private int totalItems;
    private double productCost;
    private double shippingCost;
    private double tax;
    private double totalBeforeTax;
    private double total;

    // 👇 OPTIONAL
    private List<OrderItemDTO> items;

    public OrderDTO(Long id, String status, Instant createdAt, int totalItems,
                    double productCost, double shippingCost, double tax,double totalBeforeTax, double total,List<OrderItemDTO> items) {
        this.id = id;
        this.status = status;
        this.createdAt = createdAt;
        this.totalItems = totalItems;
        this.productCost = productCost;
        this.shippingCost = shippingCost;
        this.tax = tax;
        this.totalBeforeTax = totalBeforeTax;
        this.total = total;
        this.items = items;


    }
    public static OrderDTO from(OrderEntity order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setStatus(order.getStatus());
        dto.setCreatedAt(order.getCreatedAt());
        return dto;
    }



    public static OrderDTO from(OrderEntity order, boolean expandProduct) {

        int totalItems = 0;
        double productCost = 0;

        if (order.getCartItems() != null) {
            for (var item : order.getCartItems()) {
                totalItems += item.getQuantity();
                productCost += item.getProduct().getPrice() * item.getQuantity();
            }
        }

        double shippingCost = order.getDeliveryOption() != null
                ? order.getDeliveryOption().getCost()
                : 0;

        double tax = Math.round((productCost + shippingCost) * 0.1 * 100.0) / 100.0;
        double totalBeforeTax =  productCost + shippingCost;
        double total = productCost + shippingCost + tax;

        // 1. Calculate the delivery date based on the order's delivery option
        int days = 7; // Default fallback
        if (order.getDeliveryOption() != null) {
            // Replace 'getDeliveryDays' with whatever your field name is in DeliveryOption model
            days = order.getDeliveryOption().getDays();
        }

        // Calculate the arrival timestamp
        Instant estimatedArrival = order.getCreatedAt().plus(days, ChronoUnit.DAYS);

        List<OrderItemDTO> items = expandProduct && order.getCartItems() != null
                ? order.getCartItems()
                .stream()
                .map(item -> OrderItemDTO.from(item, true, estimatedArrival))
                .toList()
                : null;

        return new OrderDTO(
                order.getId(),
                order.getStatus(),
                order.getCreatedAt(),
                totalItems,
                productCost,
                shippingCost,
                tax,
                totalBeforeTax,
                total,
                items
        );
    }
}
