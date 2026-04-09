package com.netserve.auth.config;

import com.netserve.auth.entity.AccountStatus;
import com.netserve.auth.entity.User;
import com.netserve.auth.repository.UserRepository;
import com.netserve.common.security.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Seeds a default admin user for production bootstrap if it doesn't exist.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrapper implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${netserve.admin.email:admin@netserve.com}")
    private String adminEmail;

    @Value("${netserve.admin.password:Admin@123}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Admin user already exists: {}", adminEmail);
            return;
        }

        User user = User.builder()
                .email(adminEmail)
                .firstName("System")
                .lastName("Admin")
                .password(passwordEncoder.encode(adminPassword))
                .phone("0000000000")
                .roles(Set.of(Role.ADMIN))
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        userRepository.save(user);
        log.info("Seeded ADMIN user: {}", adminEmail);
    }
}
