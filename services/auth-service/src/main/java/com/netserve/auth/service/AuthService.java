package com.netserve.auth.service;

import com.netserve.auth.dto.*;
import com.netserve.auth.entity.AccountStatus;
import com.netserve.auth.entity.RefreshToken;
import com.netserve.auth.entity.User;
import com.netserve.auth.exception.AuthException;
import com.netserve.auth.repository.RefreshTokenRepository;
import com.netserve.auth.repository.UserRepository;
import com.netserve.common.security.JwtUtil;
import com.netserve.common.security.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final com.netserve.auth.kafka.AuthEventPublisher authEventPublisher;

    @Value("${netserve.jwt.refresh-token-expiry:604800000}")
    private long refreshTokenExpiry;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email already registered");
        }

        Set<Role> roles = new HashSet<>();
        roles.add(Role.CUSTOMER);

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .roles(roles)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        user = userRepository.save(user);
        log.info("User registered: {}", user.getEmail());

        return generateAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new AuthException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthException("Invalid email or password");
        }

        if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new AuthException("Account is suspended. Please contact support.");
        }

        if (user.getAccountStatus() == AccountStatus.TERMINATED) {
            throw new AuthException("Account has been terminated.");
        }

        log.info("User logged in: {}", user.getEmail());
        return generateAuthResponse(user);
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
        log.info("User logged out, all refresh tokens revoked: userId={}", userId);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new AuthException("Invalid refresh token"));

        if (refreshToken.isRevoked()) {
            throw new AuthException("Refresh token has been revoked");
        }

        if (refreshToken.isExpired()) {
            throw new AuthException("Refresh token has expired");
        }

        // Revoke old token
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        // Generate new tokens
        return generateAuthResponse(refreshToken.getUser());
    }

    public void forgotPassword(String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email.toLowerCase());

        if (optionalUser.isEmpty()) {
            // Silently return — prevents email enumeration attacks
            log.debug("Password reset requested for non-existent email: {}", email);
            return;
        }

        User user = optionalUser.get();
        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        user.setPasswordResetExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), token, user.getFirstName());
        log.info("Password reset email sent to: {}", email);
    }

    @Transactional
    public void resetPassword(PasswordResetRequest request) {
        User user = userRepository.findByPasswordResetToken(request.getToken())
                .orElseThrow(() -> new AuthException("Invalid reset token"));

        if (user.getPasswordResetExpiry() == null || LocalDateTime.now().isAfter(user.getPasswordResetExpiry())) {
            throw new AuthException("Reset token has expired");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiry(null);
        userRepository.save(user);

        // Revoke all refresh tokens
        refreshTokenRepository.revokeAllByUserId(user.getId());
        log.info("Password reset for: {}", user.getEmail());
    }

    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found"));

        return toProfileResponse(user);
    }

    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toProfileResponse)
                .toList();
    }

    @Transactional
    public void deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found"));

        // Delete tokens (avoid FK violation)
        refreshTokenRepository.deleteByUserId(userId);
        
        // Delete user
        userRepository.delete(user);
        log.info("User deleted from auth-service: {}", user.getEmail());

        // Publish event to delete data across microservices
        authEventPublisher.publishUserDeleted(
                com.netserve.common.event.UserDeletedEvent.builder()
                        .userId(userId)
                        .build()
        );
    }

    @Transactional
    public UserProfileResponse updateUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found"));

        Role newRole;
        try {
            newRole = Role.valueOf(roleName.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AuthException("Invalid role: " + roleName + ". Valid roles: ADMIN, SUPPORT, FINANCE, CUSTOMER");
        }

        user.getRoles().clear();
        user.getRoles().add(newRole);
        userRepository.save(user);
        log.info("Updated role for user {} to {}", user.getEmail(), newRole);

        return toProfileResponse(user);
    }

    private UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .roles(user.getRoles().stream().map(Enum::name).collect(Collectors.toSet()))
                .accountStatus(user.getAccountStatus().name())
                .build();
    }

    // ─── Helpers ────────────────────────────────────────

    private AuthResponse generateAuthResponse(User user) {
        List<String> roleNames = user.getRoles().stream()
                .map(Enum::name)
                .toList();

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), roleNames);
        String refreshTokenStr = jwtUtil.generateRefreshToken(user.getId());

        // Save refresh token in DB
        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenStr)
                .user(user)
                .expiryDate(LocalDateTime.now().plus(refreshTokenExpiry, java.time.temporal.ChronoUnit.MILLIS))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(new HashSet<>(roleNames))
                .build();
    }
}
