package com.muigo.ecommerce.dto;

public class OrderCreateRequestDTO {

    private Long deliveryOptionId;

    // optional – for future use (Mpesa ref, Stripe ID, etc.)
    private String paymentReference;

}
