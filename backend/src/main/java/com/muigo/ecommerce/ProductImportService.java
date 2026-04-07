package com.muigo.ecommerce;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muigo.ecommerce.models.Product;
import com.muigo.ecommerce.repositories.ProductRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;

@Service
public class ProductImportService {

    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    public ProductImportService(ProductRepository productRepository, ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void importProductsFromJson(String jsonFilePath) throws Exception {
        ClassPathResource resource = new ClassPathResource(jsonFilePath);
        InputStream inputStream = resource.getInputStream();

        JsonNode rootNode = objectMapper.readTree(inputStream);

        int imported = 0;
        int skipped = 0;

        for (JsonNode node : rootNode) {

            String sku = node.has("sku") ? node.get("sku").asText() : null;

            if (sku == null || sku.trim().isEmpty()) {
                System.out.println("Skipping invalid product (no SKU): " + node);
                continue;
            }

            // Skip duplicates by SKU
            if (productRepository.existsBySku(sku)) {
                skipped++;
                continue;
            }

            Product product = new Product();
            product.setSku(sku);
            product.setName(node.has("name") ? node.get("name").asText() : null);
            product.setDescription(node.has("description") ? node.get("description").asText() : null);
            product.setPrice(node.has("price") ? node.get("price").asDouble() : 0.0);
            product.setImage(node.has("image") ? node.get("image").asText() : null);
            product.setRating(node.has("rating") && node.get("rating").has("stars") ? node.get("rating").get("stars").asDouble() : 0.0);
            product.setRatingCount(node.has("rating") && node.get("rating").has("count") ? node.get("rating").get("count").asInt() : 0);

            productRepository.save(product);
            imported++;
        }

        System.out.println("✅ Imported: " + imported + " | Skipped duplicates: " + skipped);
    }
}
