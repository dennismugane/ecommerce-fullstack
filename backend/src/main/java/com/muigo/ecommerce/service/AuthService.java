package com.muigo.ecommerce.service;

import com.muigo.ecommerce.config.JwtUtil;
import com.muigo.ecommerce.dto.AuthResponse;
import com.muigo.ecommerce.dto.LoginRequest;
import com.muigo.ecommerce.dto.RegisterRequest;
import com.muigo.ecommerce.models.UserEntity;
import com.muigo.ecommerce.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        // 1. Check if email is already taken
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // 2. Build and save the new user
        UserEntity user = new UserEntity();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // bcrypt hash
        user.setRole("USER"); // default role
        user.setCreatedAt(Instant.now());
        userRepository.save(user);

        // 3. Generate and return token
        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getRole());
    }

    public AuthResponse login(LoginRequest request) {
        // 1. Authenticate — throws BadCredentialsException if wrong password
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // 2. Load user and generate token
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getRole());
    }
}
