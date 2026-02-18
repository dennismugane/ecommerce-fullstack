package com.muigo.ecommerce.controllers;

import com.muigo.ecommerce.dto.CartItemDTO;
import com.muigo.ecommerce.dto.CartRequest;
import com.muigo.ecommerce.dto.CartSummaryDTO;
import com.muigo.ecommerce.dto.CartUpdateRequest;
import com.muigo.ecommerce.models.CartItem;
import com.muigo.ecommerce.models.Product;
import com.muigo.ecommerce.repositories.CartItemRepository;
import com.muigo.ecommerce.repositories.DeliveryOptionRepository;
import com.muigo.ecommerce.repositories.OrderRepository;
import com.muigo.ecommerce.repositories.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartItemController {
    private final CartItemRepository cartItemRepo;
    private final ProductRepository productRepo;
    private final DeliveryOptionRepository deliveryOptionRepo;
    @Autowired
    private OrderRepository orderRepository;


    // GET /api/cart?expand=product
    @GetMapping
    public List<CartItemDTO> getCart(@RequestParam(required = false) String expand) {
        List<CartItem> items = cartItemRepo.findByOrderedFalse();

        return items.stream()
                .map(item -> CartItemDTO.from(item, item.getProduct()))
                .toList();
    }

    @GetMapping("/payments")
    public CartSummaryDTO getCartSummary() {
        List<CartItem> cartItems = cartItemRepo.findByOrderedFalse();

        int totalItems = 0;
        double productCostCents = 0;

        // Use a flag to make sure we only pick shipping cost once for the whole order
        boolean shippingCalculated = false;
        for (CartItem item : cartItems) {
            totalItems += item.getQuantity();
            // Calculate product cost (keeping it in cents/long for precision as your code suggests)
            productCostCents += (item.getProduct().getPrice() * item.getQuantity());

        }

        double taxCents = Math.round(productCostCents * 0.1); // 10% tax logic
        double totalCostCents = productCostCents + taxCents;

        return new CartSummaryDTO(
                totalItems,
                CartSummaryDTO.money(productCostCents),
                CartSummaryDTO.money(taxCents),
                CartSummaryDTO.money(totalCostCents)
        );
    }

    // POST /api/cart
    @PostMapping
    public ResponseEntity<?> addToCart(@RequestBody CartRequest req) {

        Product product = productRepo.findById(req.getProductId()).orElse(null);
        if (product == null)
            return ResponseEntity.badRequest().body("Product not found");

        CartItem item = cartItemRepo.findByProduct_IdAndOrderedFalse(req.getProductId())
                .orElse(null);

        if (item != null) {
            // increase quantity
            item.setQuantity(item.getQuantity() + req.getQuantity());
        } else {
            // create new cart item
            item = new CartItem();
            item.setProduct(product);
            item.setQuantity(req.getQuantity());
            item.setCreatedAt(Instant.now());
        }

        item.setUpdatedAt(Instant.now());
        cartItemRepo.save(item);

        return ResponseEntity.status(HttpStatus.CREATED).body(CartItemDTO.from(item));
    }

    @PutMapping("/{productId}")
    public ResponseEntity<?> updateCart(
            @PathVariable Long productId,
            @RequestBody CartUpdateRequest req) {

        CartItem item = cartItemRepo
                .findByProduct_IdAndOrderedFalse(productId)
                .orElse(null);

        if (item == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cart item not found");

        // Update quantity
        if (req.getQuantity() != null) {
            if (req.getQuantity() < 1)
                return ResponseEntity.badRequest().body("Quantity must be > 0");

            item.setQuantity(req.getQuantity());
        }

        item.setUpdatedAt(Instant.now());
        cartItemRepo.save(item);

        return ResponseEntity.ok(CartItemDTO.from(item));
    }

    // DELETE /api/cart/{productId}
    @DeleteMapping("/{productId}")
    public ResponseEntity<?> deleteCart(@PathVariable Long productId) {
        CartItem item = cartItemRepo.findByProduct_IdAndOrderedFalse(productId)
                .orElse(null);

        if (item == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cart item not found");

        cartItemRepo.delete(item);
        return ResponseEntity.noContent().build();
    }
}
