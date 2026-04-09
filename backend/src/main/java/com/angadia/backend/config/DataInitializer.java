package com.angadia.backend.config;

import com.angadia.backend.domain.entity.User;
import com.angadia.backend.domain.enums.Role;
import com.angadia.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        userRepository.findByUsername("admin").ifPresentOrElse(
            admin -> {
                log.info("Admin user 'admin' already present. Status - Active: {}, Locked: {}", 
                    admin.isActive(), admin.isLocked());
                
                // Safety: If the admin is locked (perhaps from previous failed attempts), unlock it
                if (admin.isLocked()) {
                    log.warn("Admin account is LOCKED. Unlocking for emergency access...");
                    admin.setLocked(false);
                    admin.setFailedAttemptCount(0);
                    userRepository.save(admin);
                }
            },
            () -> {
                log.info("Admin user 'admin' not found. Seeding default SUPER_ADMIN...");
                User admin = User.builder()
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .role(Role.ROLE_SUPER_ADMIN)
                    .fullName("System Administrator")
                    .isActive(true)
                    .forcePasswordReset(true)
                    .build();
                userRepository.save(admin);
                log.info("Default SUPER_ADMIN created. Username: admin, Password: admin123");
            }
        );
    }
}
