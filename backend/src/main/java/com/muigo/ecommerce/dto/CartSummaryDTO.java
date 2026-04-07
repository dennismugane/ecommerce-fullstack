package com.muigo.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartSummaryDTO {

    private int totalItems;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal productCost;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal shippingCost;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal tax;

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private BigDecimal total;

    public static BigDecimal money(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }
}