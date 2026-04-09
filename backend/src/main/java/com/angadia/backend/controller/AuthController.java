package com.angadia.backend.controller;

import com.angadia.backend.dto.request.LoginRequest;
import com.angadia.backend.dto.request.RefreshTokenRequest;
import com.angadia.backend.dto.request.SignupRequest;
import com.angadia.backend.dto.response.ApiResponse;
import com.angadia.backend.dto.response.AuthResponse;
import com.angadia.backend.security.CustomUserDetails;
import com.angadia.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication", description = "Login, token refresh, logout")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Login with username and password")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.login(request, getIp(httpRequest), getAgent(httpRequest));
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @Operation(summary = "Register a new user account")
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(
        @Valid @RequestBody SignupRequest request,
        HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.signup(request, getIp(httpRequest), getAgent(httpRequest));
        return ResponseEntity.ok(ApiResponse.success(response, "Registration successful"));
    }

    @Operation(summary = "Refresh access token using refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
        @Valid @RequestBody RefreshTokenRequest request,
        HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.refresh(request, getIp(httpRequest), getAgent(httpRequest));
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed"));
    }

    @Operation(summary = "Logout and revoke all refresh tokens")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        HttpServletRequest httpRequest
    ) {
        authService.logout(userDetails.getId(), getIp(httpRequest), getAgent(httpRequest));
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    @Operation(summary = "Change the authenticated user's password")
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody com.angadia.backend.dto.request.ChangePasswordRequest request,
        HttpServletRequest httpRequest
    ) {
        authService.changePassword(userDetails.getId(), userDetails.getUsername(), request.currentPassword(), request.newPassword(), getIp(httpRequest), getAgent(httpRequest));
        return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully. Please log in again."));
    }

    private String getIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isBlank()) ? forwarded.split(",")[0].trim() : req.getRemoteAddr();
    }

    private String getAgent(HttpServletRequest req) {
        return req.getHeader("User-Agent");
    }
}
