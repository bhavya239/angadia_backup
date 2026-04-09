package com.angadia.backend.controller;

import com.angadia.backend.domain.entity.User;
import com.angadia.backend.dto.response.ApiResponse;
import com.angadia.backend.service.UserService;
import com.angadia.backend.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        // Omitting password hashes from output in a real mapper
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<User>> createUser(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestBody Map<String, String> payload,
        HttpServletRequest request
    ) {
        User init = userDetails.getUser();
        User input = User.builder().username(payload.get("username")).fullName(payload.get("fullName")).role(com.angadia.backend.domain.enums.Role.valueOf(payload.get("role"))).build();

        return ResponseEntity.ok(ApiResponse.success(userService.createUser(init, input, payload.get("password"), request.getRemoteAddr(), request.getHeader("User-Agent"))));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> resetPassword(
        @PathVariable String id,
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestBody Map<String, String> payload,
        HttpServletRequest request
    ) {
        User init = userDetails.getUser();
        userService.adminResetPassword(init, id, payload.get("newPassword"), request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.success("Password reset to temporary password"));
    }

    @PostMapping("/{id}/action")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> performAction(
        @PathVariable String id,
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestParam String type,
        HttpServletRequest request
    ) {
        User init = userDetails.getUser();
        userService.performAction(init, id, type, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.success("Action applied : " + type));
    }
}
