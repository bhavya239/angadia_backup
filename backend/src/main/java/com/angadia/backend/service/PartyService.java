package com.angadia.backend.service;

import com.angadia.backend.domain.entity.Party;
import com.angadia.backend.domain.enums.AuditAction;
import com.angadia.backend.dto.request.CreatePartyRequest;
import com.angadia.backend.dto.response.PartyResponse;
import com.angadia.backend.exception.BusinessRuleException;
import com.angadia.backend.exception.BusinessException;
import com.angadia.backend.exception.EntityNotFoundException;
import com.angadia.backend.repository.CityRepository;
import com.angadia.backend.repository.PartyRepository;
import com.angadia.backend.repository.TransactionRepository;
import com.angadia.backend.util.SequenceGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartyService {

    private final PartyRepository partyRepository;
    private final CityRepository cityRepository;
    private final TransactionRepository transactionRepository;
    private final SequenceGenerator sequenceGenerator;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public PartyResponse createParty(CreatePartyRequest req, String userId, String username,
                                     String ipAddress, String userAgent) {
        com.angadia.backend.domain.entity.City city = cityRepository.findByNameIgnoreCase(req.cityName().trim())
            .orElseGet(() -> {
                com.angadia.backend.domain.entity.City newCity = com.angadia.backend.domain.entity.City.builder()
                    .name(req.cityName().trim())
                    .state("Unknown")
                    .isActive(true)
                    .createdAt(java.time.Instant.now())
                    .build();
                return cityRepository.save(newCity);
            });

        if (!city.isActive()) throw new BusinessRuleException("Selected city is inactive");

        if (partyRepository.existsByNameIgnoreCaseAndCityId(req.name().trim(), city.getId())) {
             throw new BusinessRuleException("A party with this exact name already exists in this city.");
        }
        if (partyRepository.existsByPhone(req.phone())) {
             throw new BusinessRuleException("This phone number is already registered to another party.");
        }

        String normalizedCode = req.partyCode() != null ? req.partyCode().trim().toUpperCase() : "";
        if (partyRepository.existsByPartyCode(normalizedCode)) {
             throw new BusinessRuleException("Party code already exists: " + normalizedCode);
        }

        // We don't use sequenceGenerator anymore, we use the user-provided exact code
        String partyCode = normalizedCode;

        Party party = Party.builder()
            .partyCode(partyCode)
            .name(req.name().trim())
            .cityId(city.getId())
            .cityName(city.getName())
            .phone(req.phone())
            .email(req.email())
            .address(req.address())
            .partyType(req.partyType())
            .crRoi(req.crRoi() != null ? req.crRoi() : BigDecimal.ZERO)
            .drRoi(req.drRoi() != null ? req.drRoi() : BigDecimal.ZERO)
            .openingBalance(req.openingBalance() != null ? req.openingBalance() : BigDecimal.ZERO)
            .openingBalanceType(req.openingBalanceType())
            .createdBy(userId)
            .build();

        Party saved = partyRepository.save(party);
        log.info("Party created: {} by user {}", partyCode, username);

        auditLogService.logAsync(userId, username, AuditAction.PARTY_CREATED,
            "Party", saved.getId(), null, toJson(saved), ipAddress, userAgent);

        return toResponse(saved);
    }

    public Page<PartyResponse> searchParties(String term, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Party> parties = (term != null && !term.isBlank())
            ? partyRepository.searchActive(term, pageable)
            : partyRepository.findByIsActive(true, pageable);
        return parties.map(this::toResponse);
    }

    public PartyResponse getParty(String id) {
        return toResponse(findById(id));
    }

    public PartyResponse updateParty(String id, CreatePartyRequest req,
                                     String userId, String username,
                                     String ipAddress, String userAgent) {
        Party existing = findById(id);
        String oldJson  = toJson(existing);

        com.angadia.backend.domain.entity.City city = cityRepository.findByNameIgnoreCase(req.cityName().trim())
            .orElseGet(() -> {
                com.angadia.backend.domain.entity.City newCity = com.angadia.backend.domain.entity.City.builder()
                    .name(req.cityName().trim())
                    .state("Unknown")
                    .isActive(true)
                    .createdAt(java.time.Instant.now())
                    .build();
                return cityRepository.save(newCity);
            });

        // Ensure party code immutability (if sent, it must match)
        if (req.partyCode() != null && !req.partyCode().trim().toUpperCase().equals(existing.getPartyCode())) {
            throw new BusinessRuleException("Party code is immutable and cannot be changed after creation.");
        }

        existing.setName(req.name().trim());
        existing.setCityId(city.getId());
        existing.setCityName(city.getName());
        existing.setPhone(req.phone());
        existing.setEmail(req.email());
        existing.setAddress(req.address());
        existing.setPartyType(req.partyType());
        existing.setCrRoi(req.crRoi() != null ? req.crRoi() : BigDecimal.ZERO);
        existing.setDrRoi(req.drRoi() != null ? req.drRoi() : BigDecimal.ZERO);

        Party saved = partyRepository.save(existing);

        auditLogService.logAsync(userId, username, AuditAction.PARTY_UPDATED,
            "Party", saved.getId(), oldJson, toJson(saved), ipAddress, userAgent);

        return toResponse(saved);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public void deleteParty(String partyId) {
        log.info("Deleting party with ID: {}", partyId);
        Party party = partyRepository.findById(partyId)
            .orElseThrow(() -> new EntityNotFoundException("Party not found"));

        log.info("Party found: {}", party.getPartyCode());
        log.info("Checking transactions for party");
        boolean hasTransactions =
            transactionRepository.existsBySenderId(partyId) ||
            transactionRepository.existsByReceiverId(partyId);

        if (hasTransactions) {
            throw new BusinessException(
                "This party has transactions and cannot be deleted"
            );
        }

        // Soft delete (IMPORTANT)
        party.setActive(false);
        partyRepository.save(party);
    }

    public long getActivePartyCount() {
        return partyRepository.countByIsActiveTrue();
    }

    public boolean checkCodeExists(String code) {
        if (code == null || code.trim().isEmpty()) return false;
        return partyRepository.existsByPartyCode(code.trim().toUpperCase());
    }

    private Party findById(String id) {
        return partyRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Party not found: " + id));
    }

    private PartyResponse toResponse(Party p) {
        return new PartyResponse(
            p.getId(), p.getPartyCode(), p.getName(),
            p.getCityId(), p.getCityName(), p.getPhone(), p.getEmail(), p.getAddress(),
            p.getPartyType(), p.getCrRoi(), p.getDrRoi(),
            p.getOpeningBalance(), p.getOpeningBalanceType(),
            p.isActive(), p.getCreatedAt(), p.getUpdatedAt()
        );
    }

    private String toJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); }
        catch (Exception e) { return "{}"; }
    }
}
