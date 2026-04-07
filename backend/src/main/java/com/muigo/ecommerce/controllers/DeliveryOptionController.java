package com.muigo.ecommerce.controllers;

import com.muigo.ecommerce.models.DeliveryOption;
import com.muigo.ecommerce.repositories.DeliveryOptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-options")
public class DeliveryOptionController {
    @Autowired
    private DeliveryOptionRepository repo;


    @GetMapping
    public List<DeliveryOption> all() {
        return repo.findAll();
    }


    @PostMapping
    public DeliveryOption create(@RequestBody DeliveryOption option) {
        return repo.save(option);
    }
}