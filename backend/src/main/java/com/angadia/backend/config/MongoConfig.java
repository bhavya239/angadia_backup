package com.angadia.backend.config;

import org.bson.types.Decimal128;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.IndexResolver;
import org.springframework.data.mongodb.core.index.MongoPersistentEntityIndexResolver;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

import org.springframework.boot.ApplicationRunner;
import lombok.extern.slf4j.Slf4j;

import com.angadia.backend.domain.entity.*;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Configuration
public class MongoConfig {

    /**
     * Custom BigDecimal <-> Decimal128 converters.
     * CRITICAL: Without these, MongoDB stores BigDecimal as String or Double
     * causing precision loss in financial calculations.
     */
    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(Arrays.asList(
            new Converter<Decimal128, BigDecimal>() {
                @Override
                public BigDecimal convert(Decimal128 source) {
                    return source.bigDecimalValue();
                }
            },
            new Converter<BigDecimal, Decimal128>() {
                @Override
                public Decimal128 convert(BigDecimal source) {
                    return new Decimal128(source);
                }
            },
            // BRIDGE CONVERTER: Handles transition from old "SUPER_ADMIN" strings to new "ROLE_SUPER_ADMIN" enum
            new Converter<String, com.angadia.backend.domain.enums.Role>() {
                @Override
                public com.angadia.backend.domain.enums.Role convert(String source) {
                    if (source == null) return null;
                    String roleStr = source.startsWith("ROLE_") ? source : "ROLE_" + source;
                    try {
                        return com.angadia.backend.domain.enums.Role.valueOf(roleStr);
                    } catch (IllegalArgumentException e) {
                        log.error("Unknown role string in database: {}", source);
                        return com.angadia.backend.domain.enums.Role.ROLE_STAFF; // Safe default
                    }
                }
            }
        ));
    }

    /**
     * Programmatic index creation at startup.
     * We set auto-index-creation: false in yml and manage here for full control.
     */
    @Bean
    public ApplicationRunner initIndexes(MongoTemplate mongoTemplate, MongoMappingContext mongoMappingContext) {
        return args -> {
            log.info("Initializing MongoDB indexes...");

            List<Class<?>> indexedEntities = List.of(
                User.class,
                City.class,
                Party.class,
                Transaction.class,
                OpeningBalance.class,
                AuditLog.class,
                RefreshToken.class,
                VatavRate.class
            );

            IndexResolver resolver = new MongoPersistentEntityIndexResolver(mongoMappingContext);

            for (Class<?> entity : indexedEntities) {
                IndexOperations ops = mongoTemplate.indexOps(entity);
                try {
                    resolver.resolveIndexFor(entity).forEach(ops::ensureIndex);
                } catch (Exception e) {
                    log.warn("Index schema conflict detected in {}. Dropping all indexes for this entity and rebuilding...", entity.getSimpleName());
                    ops.dropAllIndexes();
                    resolver.resolveIndexFor(entity).forEach(ops::ensureIndex);
                }
            }

            log.info("MongoDB indexes initialized successfully.");
        };
    }
}
