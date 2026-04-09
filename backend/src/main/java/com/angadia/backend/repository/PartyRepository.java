package com.angadia.backend.repository;

import com.angadia.backend.domain.entity.Party;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartyRepository extends MongoRepository<Party, String> {

    Optional<Party> findByPartyCode(String partyCode);

    Optional<Party> findByNameIgnoreCase(String name);

    boolean existsByPartyCode(String partyCode);

    boolean existsByNameIgnoreCaseAndCityId(String name, String cityId);

    boolean existsByPhone(String phone);

    @Query("{ 'isActive': true, $or: [ {'name': {$regex: ?0, $options: 'i'}}, {'partyCode': {$regex: ?0, $options: 'i'}} ] }")
    Page<Party> searchActive(String term, Pageable pageable);

    @Query("{ 'isActive': ?0 }")
    Page<Party> findByIsActive(boolean isActive, Pageable pageable);

    long countByIsActiveTrue();
}
