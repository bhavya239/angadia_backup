package com.angadia.backend.service;

import com.angadia.backend.domain.entity.City;
import com.angadia.backend.domain.enums.AuditAction;
import com.angadia.backend.exception.BusinessRuleException;
import com.angadia.backend.exception.EntityNotFoundException;
import com.angadia.backend.repository.CityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CityService {

    private final CityRepository cityRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public City createCity(String name, String state, String userId, String username) {
        String code = name.trim().toUpperCase().replaceAll("\\s+", "_");
        if (cityRepository.existsByNameIgnoreCase(name.trim()) || cityRepository.findByCode(code).isPresent())
            throw new BusinessRuleException("City already exists: " + name);
        City city = City.builder()
            .name(name.trim())
            .code(code)
            .district("Unknown")
            .state(state != null ? state.trim() : "Gujarat")
            .build();
        City saved = cityRepository.save(city);
        auditLogService.logAsync(userId, username, AuditAction.CITY_CREATED, "City", saved.getId(), null, name, null, null);
        return saved;
    }

    public City createIfNotExists(String name, String userId, String username) {
        String code = name.trim().toUpperCase().replaceAll("\\s+", "_");
        return cityRepository.findByCode(code).orElseGet(() -> {
            City city = City.builder()
                .name(name.trim())
                .code(code)
                .district("Unknown")
                .state("Unknown")
                .build();
            City saved = cityRepository.save(city);
            if (userId != null) {
                auditLogService.logAsync(userId, username, AuditAction.CITY_CREATED, "City", saved.getId(), null, name, null, null);
            }
            return saved;
        });
    }

    public List<City> getAllActiveCities() {
        return cityRepository.findByIsActiveTrueOrderByNameAsc();
    }

    public City getCity(String id) {
        return cityRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("City not found: " + id));
    }

    public City updateCity(String id, String name, String state, String userId, String username) {
        City city = getCity(id);
        String old = city.getName();
        city.setName(name.trim());
        if (state != null) city.setState(state.trim());
        City saved = cityRepository.save(city);
        auditLogService.logAsync(userId, username, AuditAction.CITY_UPDATED, "City", id, old, name, null, null);
        return saved;
    }
}
