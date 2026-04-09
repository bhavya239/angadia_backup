package com.angadia.backend.dto.response;

import java.time.Instant;

public record ApiResponse<T>(
    T data,
    String message,
    Instant timestamp
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data, "Success", Instant.now());
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(data, message, Instant.now());
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(null, message, Instant.now());
    }
}
