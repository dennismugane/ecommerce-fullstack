package com.muigo.ecommerce;

import com.muigo.ecommerce.repositories.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final ProductImportService importService;
    private final ProductRepository productRepository;

    public DataLoader(ProductImportService importService,
                      ProductRepository productRepository) {
        this.importService = importService;
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (productRepository.count() == 0) {
            importService.importProductsFromJson("data/products.json");
            System.out.println("✅ Products imported");
        } else {
            System.out.println("ℹ️ Products already exist — skipping import");
        }
    }
}

