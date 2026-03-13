package com.muigo.ecommerce.controllers;

import com.muigo.ecommerce.config.SecurityUtil;
import com.muigo.ecommerce.dto.CartItemDTO;
import com.muigo.ecommerce.dto.CartRequest;
import com.muigo.ecommerce.dto.CartSummaryDTO;
import com.muigo.ecommerce.dto.CartUpdateRequest;
import com.muigo.ecommerce.models.CartItem;
import com.muigo.ecommerce.models.Product;
import com.muigo.ecommerce.models.UserEntity;
import com.muigo.ecommerce.repositories.CartItemRepository;
import com.muigo.ecommerce.repositories.ProductRepository;
import lombok.RequiredArgsConstructor;
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
    private final SecurityUtil securityUtil;

    // GET /api/cart — returns only the current user's cart
    @GetMapping
    public List<CartItemDTO> getCart() {
        UserEntity user = securityUtil.getCurrentUser();
        List<CartItem> items = cartItemRepo.findByUserAndOrderedFalse(user);
        return items.stream()
                .map(item -> CartItemDTO.from(item, item.getProduct()))
                .toList();
    }

    // GET /api/cart/payments — payment summary for current user's cart
    @GetMapping("/payments")
    public CartSummaryDTO getCartSummary() {
        UserEntity user = securityUtil.getCurrentUser();
        List<CartItem> cartItems = cartItemRepo.findByUserAndOrderedFalse(user);

        int totalItems = 0;
        double productCost = 0;
        double shippingCost = 0;

        for (CartItem item : cartItems) {
            totalItems += item.getQuantity();
            productCost += item.getProduct().getPrice() * item.getQuantity();

        }

        double tax = Math.round(productCost * 0.1 * 100.0) / 100.0;
        double total = productCost + tax;

        return new CartSummaryDTO(
                totalItems,
                CartSummaryDTO.money(productCost),
                CartSummaryDTO.money(shippingCost),
                CartSummaryDTO.money(tax),
                CartSummaryDTO.money(total)
        );
    }

    // POST /api/cart — add item to current user's cart
    @PostMapping
    public ResponseEntity<?> addToCart(@RequestBody CartRequest req) {
        UserEntity user = securityUtil.getCurrentUser();

        Product product = productRepo.findById(req.getProductId()).orElse(null);
        if (product == null)
            return ResponseEntity.badRequest().body("Product not found");

        // Check if this user already has this product in cart
        CartItem item = cartItemRepo
                .findByProduct_IdAndOrderedFalseAndUser(req.getProductId(), user)
                .orElse(null);

        if (item != null) {
            item.setQuantity(item.getQuantity() + req.getQuantity());
        } else {
            item = new CartItem();
            item.setProduct(product);
            item.setUser(user);           // ← tie to current user
            item.setQuantity(req.getQuantity());
            item.setCreatedAt(Instant.now());
        }

        item.setUpdatedAt(Instant.now());
        cartItemRepo.save(item);

        return ResponseEntity.status(HttpStatus.CREATED).body(CartItemDTO.from(item));
    }

    // PUT /api/cart/{productId} — update quantity (current user only)
    @PutMapping("/{productId}")
    public ResponseEntity<?> updateCart(
            @PathVariable Long productId,
            @RequestBody CartUpdateRequest req) {

        UserEntity user = securityUtil.getCurrentUser();

        CartItem item = cartItemRepo
                .findByProduct_IdAndOrderedFalseAndUser(productId, user)
                .orElse(null);

        if (item == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cart item not found");

        if (req.getQuantity() != null) {
            if (req.getQuantity() < 1)
                return ResponseEntity.badRequest().body("Quantity must be > 0");
            item.setQuantity(req.getQuantity());
        }

        item.setUpdatedAt(Instant.now());
        cartItemRepo.save(item);

        return ResponseEntity.ok(CartItemDTO.from(item));
    }

    // DELETE /api/cart/{productId} — remove item (current user only)
    @DeleteMapping("/{productId}")
    public ResponseEntity<?> deleteCart(@PathVariable Long productId) {
        UserEntity user = securityUtil.getCurrentUser();

        CartItem item = cartItemRepo
                .findByProduct_IdAndOrderedFalseAndUser(productId, user)
                .orElse(null);

        if (item == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cart item not found");

        cartItemRepo.delete(item);
        return ResponseEntity.noContent().build();
    }
}
