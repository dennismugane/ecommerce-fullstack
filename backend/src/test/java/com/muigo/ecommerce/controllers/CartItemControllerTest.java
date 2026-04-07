//package com.muigo.ecommerce.controllers;
//
//import com.muigo.ecommerce.config.JwtUtil;
//import com.muigo.ecommerce.config.SecurityUtil;
//import com.muigo.ecommerce.models.CartItem;
//import com.muigo.ecommerce.models.Product;
//import com.muigo.ecommerce.models.UserEntity;
//import com.muigo.ecommerce.repositories.CartItemRepository;
//import com.muigo.ecommerce.repositories.ProductRepository;
//import com.muigo.ecommerce.service.UserDetailsServiceImpl;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
//import org.springframework.security.test.context.support.WithMockUser;
//import org.springframework.test.context.bean.override.mockito.MockitoBean;
//import org.springframework.test.web.servlet.MockMvc;
//
//import java.util.List;
//import java.util.Optional;
//
//import static org.mockito.Mockito.when;
//import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
//
//@WebMvcTest(CartItemController.class)
//class CartItemControllerTest {
//
//    @Autowired
//    private MockMvc mockMvc;
//
//    @MockitoBean
//    private CartItemRepository cartItemRepo;
//
//    @MockitoBean
//    private ProductRepository productRepo;
//
//    @MockitoBean
//    private SecurityUtil securityUtil;
//    @MockitoBean
//    private JwtUtil jwtUtil;
//    @MockitoBean
//    private UserDetailsServiceImpl userDetailsService;
//
//
//    @Test
//    @WithMockUser
//    void shouldReturnUserCart() throws Exception {
//        UserEntity user = new UserEntity();
//
//        Product product = new Product();
//        product.setPrice(100.0);
//
//        CartItem item = new CartItem();
//        item.setProduct(product);
//        item.setQuantity(2);
//        item.setUser(user);
//
//        when(securityUtil.getCurrentUser()).thenReturn(user);
//        when(cartItemRepo.findByUserAndOrderedFalse(user))
//                .thenReturn(List.of(item));
//
//        mockMvc.perform(get("/api/cart"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].quantity").value(2));
//    }
//
//    @Test
//    @WithMockUser
//    void shouldAddItemToCart() throws Exception {
//        UserEntity user = new UserEntity();
//
//        Product product = new Product();
//        product.setId(1L);
//        product.setPrice(100.0);
//
//        when(securityUtil.getCurrentUser()).thenReturn(user);
//        when(productRepo.findById(1L)).thenReturn(Optional.of(product));
//        when(cartItemRepo.findByProduct_IdAndOrderedFalseAndUser(1L, user))
//                .thenReturn(Optional.empty());
//
//        String requestBody = """
//        {
//          "productId": 1,
//          "quantity": 2
//        }
//    """;
//
//        mockMvc.perform(post("/api/cart")
//                        .with(csrf())
//                        .contentType("application/json")
//                        .content(requestBody))
//                .andExpect(status().isCreated());
//    }
//
//}