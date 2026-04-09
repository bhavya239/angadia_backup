package com.angadia.backend.repository;

import com.angadia.backend.domain.entity.OpeningBalance;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OpeningBalanceRepository extends MongoRepository<OpeningBalance, String> {
    Optional<OpeningBalance> findByPartyIdAndFinancialYear(String partyId, String financialYear);
    Optional<OpeningBalance> findTopByPartyIdOrderByBalanceDateDesc(String partyId);
}
