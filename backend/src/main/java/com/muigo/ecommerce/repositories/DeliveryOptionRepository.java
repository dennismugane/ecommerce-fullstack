package com.muigo.ecommerce.repositories;

import com.muigo.ecommerce.models.DeliveryOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryOptionRepository extends JpaRepository<DeliveryOption, Long> {
}
