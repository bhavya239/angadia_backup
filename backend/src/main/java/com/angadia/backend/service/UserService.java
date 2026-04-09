package com.angadia.backend.service;

import com.angadia.backend.domain.entity.User;
import com.angadia.backend.domain.enums.AuditAction;
import com.angadia.backend.domain.enums.Role;
import com.angadia.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User createUser(User initiator, User newUserDto, String rawPassword, String ipAddress, String userAgent) {
        
        // Authorization Rules
        if (initiator.getRole() == Role.ROLE_STAFF) {
            throw new SecurityException("Staff cannot create users.");
        }
        if (initiator.getRole() == Role.ROLE_ADMIN && newUserDto.getRole() != Role.ROLE_STAFF) {
            throw new SecurityException("Admins can only create Staff roles.");
        }
        if (initiator.getRole() == Role.ROLE_SUPER_ADMIN && newUserDto.getRole() == Role.ROLE_SUPER_ADMIN) {
             throw new SecurityException("Cannot create multiple SuperAdmins via standard UI flow.");
        }

        User user = User.builder()
            .username(newUserDto.getUsername())
            .fullName(newUserDto.getFullName())
            .role(newUserDto.getRole())
            .passwordHash(passwordEncoder.encode(rawPassword))
            .forcePasswordReset(true) // Force reset on first login
            .isActive(true)
            .build();

        User saved = userRepository.save(user);

        auditLogService.logAsync(initiator.getId(), initiator.getUsername(), AuditAction.USER_CREATED,
            "User", saved.getId(), null, "{\"username\":\"" + saved.getUsername() + "\"}", ipAddress, userAgent);

        return saved;
    }

    public void adminResetPassword(User initiator, String targetUserId, String newTempPassword, String ipAddress, String userAgent) {
        User target = userRepository.findById(targetUserId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Authorization Rules
        if (initiator.getRole() == Role.ROLE_STAFF) throw new SecurityException("Staff cannot reset passwords.");
        if (initiator.getRole() == Role.ROLE_ADMIN && target.getRole() != Role.ROLE_STAFF) {
            throw new SecurityException("Admins can only reset Staff passwords.");
        }

        target.setPasswordHash(passwordEncoder.encode(newTempPassword));
        target.setForcePasswordReset(true);
        target.setFailedAttemptCount(0);
        target.setLocked(false); // Auto unlock if reset
        userRepository.save(target);

        auditLogService.logAsync(initiator.getId(), initiator.getUsername(), AuditAction.PASSWORD_CHANGE,
            "User", target.getId(), null, "{\"action\":\"ADMIN_RESET\"}", ipAddress, userAgent);
    }

    public void performAction(User initiator, String targetUserId, String action, String ipAddress, String userAgent) {
        User target = userRepository.findById(targetUserId).orElseThrow();
        if (initiator.getRole() == Role.ROLE_STAFF) throw new SecurityException("Not authorized");

        switch (action) {
            case "LOCK": target.setLocked(true); break;
            case "UNLOCK": target.setLocked(false); target.setFailedAttemptCount(0); break;
            case "DEACTIVATE": target.setActive(false); break;
            case "ACTIVATE": target.setActive(true); break;
        }
        userRepository.save(target);

        auditLogService.logAsync(initiator.getId(), initiator.getUsername(), AuditAction.USER_UPDATED,
            "User", target.getId(), null, "{\"action\":\"" + action + "\"}", ipAddress, userAgent);
    }
}
