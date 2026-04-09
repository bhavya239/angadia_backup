package com.angadia.backend.service;

import com.angadia.backend.domain.entity.RefreshToken;
import com.angadia.backend.domain.entity.User;
import com.angadia.backend.domain.enums.AuditAction;
import com.angadia.backend.domain.enums.Role;
import com.angadia.backend.dto.request.LoginRequest;
import com.angadia.backend.dto.request.RefreshTokenRequest;
import com.angadia.backend.dto.request.SignupRequest;
import com.angadia.backend.dto.response.AuthResponse;
import com.angadia.backend.exception.BusinessRuleException;
import com.angadia.backend.repository.RefreshTokenRepository;
import com.angadia.backend.repository.UserRepository;
import com.angadia.backend.security.jwt.JwtService;
import com.angadia.backend.config.AppProperties;
import com.angadia.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;
    private final AppProperties appProperties;

    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        log.debug("Attempting login for user: {}", request.username());
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
        } catch (BadCredentialsException e) {
            log.debug("Authentication failed for '{}': check password or if user exists", request.username());
            auditLogService.logAsync(null, request.username(), AuditAction.LOGIN_FAILED,
                "User", null, null, null, ipAddress, userAgent);
            throw new BusinessRuleException("Invalid username or password");
        } catch (Exception e) {
            log.error("Unexpected authentication error for '{}': {}", request.username(), e.getMessage());
            throw e;
        }

        User user = userRepository.findByUsername(request.username())
            .orElseThrow(() -> new BusinessRuleException("User not found"));

        // Update last login timestamp
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        AuthResponse response = buildAuthResponse(user);

        auditLogService.logAsync(user.getId(), user.getUsername(), AuditAction.LOGIN,
            "User", user.getId(), null, null, ipAddress, userAgent);

        return response;
    }

    public AuthResponse signup(SignupRequest request, String ipAddress, String userAgent) {
        if (userRepository.findByUsername(request.username()).isPresent()) {
            throw new BusinessRuleException("Username is already taken");
        }

        org.springframework.security.crypto.password.PasswordEncoder encoder = 
            new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(12);

        User user = User.builder()
            .username(request.username())
            .passwordHash(encoder.encode(request.password()))
            .fullName(request.fullName())
            .role(Role.ROLE_STAFF) // Default public signup role
            .isActive(true)
            .isLocked(false)
            .failedAttemptCount(0)
            .createdAt(Instant.now())
            .lastLoginAt(Instant.now())
            .build();

        user = userRepository.save(user);

        AuthResponse response = buildAuthResponse(user);

        auditLogService.logAsync(user.getId(), user.getUsername(), AuditAction.LOGIN,
            "User", user.getId(), null, "User signed up", ipAddress, userAgent);

        return response;
    }

    public AuthResponse refresh(RefreshTokenRequest request, String ipAddress, String userAgent) {
        String tokenHash = hashToken(request.refreshToken());

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new BusinessRuleException("Invalid refresh token"));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessRuleException("Refresh token expired or revoked");
        }

        // Revoke old token (rotation)
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = userRepository.findById(stored.getUserId())
            .orElseThrow(() -> new BusinessRuleException("User not found"));

        if (!user.isActive()) {
            throw new BusinessRuleException("User account is inactive");
        }

        AuthResponse response = buildAuthResponse(user);

        auditLogService.logAsync(user.getId(), user.getUsername(), AuditAction.TOKEN_REFRESH,
            "User", user.getId(), null, null, ipAddress, userAgent);

        return response;
    }

    public void logout(String userId, String ipAddress, String userAgent) {
        refreshTokenRepository.deleteByUserId(userId);
        User user = userRepository.findById(userId).orElse(null);
        String username = user != null ? user.getUsername() : "unknown";
        auditLogService.logAsync(userId, username, AuditAction.LOGOUT,
            "User", userId, null, null, ipAddress, userAgent);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken  = jwtService.generateAccessToken(user.getId(), user.getUsername(), user.getRole().name());
        String rawRefresh   = UUID.randomUUID().toString();
        String refreshHash  = hashToken(rawRefresh);

        RefreshToken token = RefreshToken.builder()
            .tokenHash(refreshHash)
            .userId(user.getId())
            .expiresAt(Instant.now().plus(appProperties.getJwt().getRefreshTokenExpiryDays(), ChronoUnit.DAYS))
            .createdAt(Instant.now())
            .build();
        refreshTokenRepository.save(token);

        return new AuthResponse(
            accessToken,
            rawRefresh,
            user.getId(),
            user.getUsername(),
            user.getRole().name(),
            user.getFullName(),
            appProperties.getJwt().getAccessTokenExpiryMs()
        );
    }

    public void changePassword(String userId, String username, String currentPassword, String newPassword, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessRuleException("User not found"));

        org.springframework.security.crypto.password.PasswordEncoder encoder = 
            new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(12);

        if (!encoder.matches(currentPassword, user.getPasswordHash())) {
            auditLogService.logAsync(userId, username, AuditAction.LOGIN_FAILED, "User", userId, null, "Failed password change", ipAddress, userAgent);
            throw new BusinessRuleException("Incorrect current password");
        }

        user.setPasswordHash(encoder.encode(newPassword));
        userRepository.save(user);

        // Invalidate all active sessions for this user by revoking refresh tokens
        refreshTokenRepository.deleteByUserId(userId);

        auditLogService.logAsync(userId, username, AuditAction.PASSWORD_CHANGE, "User", userId, null, null, ipAddress, userAgent);
    }

    public static String hashToken(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
