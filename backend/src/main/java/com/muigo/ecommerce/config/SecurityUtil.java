package com.muigo.ecommerce.config;

import com.muigo.ecommerce.models.UserEntity;
import com.muigo.ecommerce.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtil {

    private final UserRepository userRepository;

    /**
     * Returns the currently authenticated UserEntity.
     * Throws RuntimeException if not authenticated or user not found.
     */
    public UserEntity getCurrentUser() {
        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName(); // email is the principal (set in JwtFilter)

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + email));
    }
}
