package com.angadia.backend.dto.response;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String userId,
    String username,
    String role,
    String fullName,
    long accessTokenExpiresIn   // milliseconds
) {}
