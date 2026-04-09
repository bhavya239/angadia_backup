package com.angadia.backend.util;

import com.angadia.backend.repository.PartyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SequenceGenerator {

    private final MongoTemplate mongoTemplate;

    private static final String COUNTERS_COLLECTION = "counters";

    /**
     * Atomic sequence increment using findAndModify.
     * This is the ONLY safe way to generate unique sequential IDs under concurrent load.
     */
    public long nextSequence(String sequenceName) {
        Query query  = new Query(Criteria.where("_id").is(sequenceName));
        Update update = new Update().inc("seq", 1);
        FindAndModifyOptions options = FindAndModifyOptions.options().returnNew(true).upsert(true);

        Map result = mongoTemplate.findAndModify(query, update, options, Map.class, COUNTERS_COLLECTION);
        return result != null ? ((Number) result.get("seq")).longValue() : 1L;
    }

    /**
     * Generate transaction number: TXN-YYYYMMDD-XXXXX
     */
    public String generateTxnNumber(LocalDate date) {
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String seqKey  = "txn-" + dateStr;
        long seq       = nextSequence(seqKey);
        return String.format("TXN-%s-%05d", dateStr, seq);
    }

    /**
     * Generate party code: CITYCODE-NNNN (e.g. AHM-0001)
     */
    public String generatePartyCode(String cityName) {
        String code   = cityName.trim().toUpperCase().replaceAll("\\s+", "").substring(0, Math.min(3, cityName.length()));
        String seqKey = "party-" + code;
        long seq      = nextSequence(seqKey);
        return String.format("%s-%04d", code, seq);
    }
}
