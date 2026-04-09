package com.angadia.backend.repository;

import com.angadia.backend.domain.entity.City;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityRepository extends MongoRepository<City, String> {
    List<City> findByIsActiveTrueOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
    Optional<City> findByNameIgnoreCase(String name);
    Optional<City> findByCode(String code);
}
