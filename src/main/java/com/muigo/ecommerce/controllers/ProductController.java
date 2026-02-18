package com.muigo.ecommerce.controllers;

import com.muigo.ecommerce.dto.ProductCreateRequestDTO;
import com.muigo.ecommerce.dto.ProductDTO;
import com.muigo.ecommerce.dto.ProductUpdateRequestDTO;
import com.muigo.ecommerce.models.Product;
import com.muigo.ecommerce.repositories.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/products")
public class ProductController {


    @Autowired
    private ProductRepository repo;


    @GetMapping
    public List<ProductDTO> getAll() {
        return repo.findAll()
                .stream()
                .map(ProductDTO::from)
                .toList();
    }


    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getOne(@PathVariable Long id) {
        return repo.findById(id)
                .map(product -> ResponseEntity.ok(ProductDTO.from(product)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }



    @PostMapping
    public ProductDTO create(@RequestBody ProductCreateRequestDTO req) {

        Product product = new Product();
        product.setSku(req.getSku());
        product.setName(req.getName());
        product.setDescription(req.getDescription());
        product.setPrice(req.getPrice());
        product.setImage(req.getImage());
        product.setRating(req.getRating());
        product.setRatingCount(req.getRatingCount());

        return ProductDTO.from(repo.save(product));
    }



    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> update(
            @PathVariable Long id,
            @RequestBody ProductUpdateRequestDTO req
    ) {
        return repo.findById(id).map(existing -> {

            if (req.getName() != null)
                existing.setName(req.getName());

            if (req.getDescription() != null)
                existing.setDescription(req.getDescription());

            if (req.getPrice() != null)
                existing.setPrice(req.getPrice());

            if (req.getImage() != null)
                existing.setImage(req.getImage());

            return ResponseEntity.ok(ProductDTO.from(repo.save(existing)));

        }).orElseGet(() -> ResponseEntity.notFound().build());
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {

        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repo.deleteById(id);
        return ResponseEntity.noContent().build(); // 204
    }

}
