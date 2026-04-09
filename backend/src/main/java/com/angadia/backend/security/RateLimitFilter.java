package com.angadia.backend.security;

import com.angadia.backend.config.AppProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final AppProperties appProperties;

    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> apiBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String ip = getIp(request);

        Bucket bucket;

        if (path.startsWith("/api/v1/auth/login")) {
            bucket = loginBuckets.computeIfAbsent(ip, this::createNewLoginBucket);
        } else if (path.startsWith("/api/v1")) {
            bucket = apiBuckets.computeIfAbsent(ip, this::createNewApiBucket);
        } else {
            // Bypass for static endpoints, actuator, swagger
            filterChain.doFilter(request, response);
            return;
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"status\":429,\"error\":\"TOO_MANY_REQUESTS\",\"message\":\"Rate limit exceeded. Please try again later.\"}"
            );
        }
    }

    private Bucket createNewLoginBucket(String key) {
        AppProperties.RateLimit config = appProperties.getRateLimit();
        Bandwidth limit = Bandwidth.classic(
            config.getLoginCapacity(),
            Refill.greedy(config.getLoginCapacity(), Duration.ofMinutes(config.getLoginRefillMinutes()))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createNewApiBucket(String key) {
        AppProperties.RateLimit config = appProperties.getRateLimit();
        Bandwidth limit = Bandwidth.classic(
            config.getApiCapacity(),
            Refill.greedy(config.getApiCapacity(), Duration.ofMinutes(config.getApiRefillMinutes()))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    private String getIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isBlank()) ? forwarded.split(",")[0].trim() : req.getRemoteAddr();
    }
}
