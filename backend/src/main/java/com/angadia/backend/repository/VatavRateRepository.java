package com.angadia.backend.repository;

import com.angadia.backend.domain.entity.VatavRate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface VatavRateRepository extends MongoRepository<VatavRate, String> {

    // Get the currently active rate (effectiveTo is null = active)
    @Query("{ 'effectiveTo': null }")
    Optional<VatavRate> findCurrentRate();

    // Rate effective on a specific date
    @Query("{ 'effectiveFrom': { $lte: ?0 }, $or: [{'effectiveTo': null}, {'effectiveTo': { $gte: ?0 }}] }")
    Optional<VatavRate> findRateForDate(LocalDate date);
}
