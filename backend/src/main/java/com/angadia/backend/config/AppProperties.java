package com.angadia.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Data
@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private RateLimit rateLimit = new RateLimit();

    @Data
    public static class Jwt {
        private String secret;
        private long accessTokenExpiryMs = 900_000L;      // 15 min
        private int refreshTokenExpiryDays = 7;
    }

    @Data
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:5173");
    }

    @Data
    public static class RateLimit {
        private int loginCapacity = 5;
        private int loginRefillMinutes = 15;
        private int apiCapacity = 200;
        private int apiRefillMinutes = 1;
    }
}
