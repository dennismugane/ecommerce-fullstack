package com.muigo.ecommerce.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Specifically handle missing images/static files
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleNotFound(NoResourceFoundException ex) {
        // We don't call printStackTrace() here so the logs stay clean
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "error", "Resource not found",
                        "path", ex.getResourcePath()
                ));
    }

    // 2. Your existing catch-all for real logic errors
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handle(Exception ex) {
        // Keep this for unexpected internal errors during development
        ex.printStackTrace();
        return ResponseEntity.status(500).body(Map.of("error", "Something went wrong!"));
    }
}