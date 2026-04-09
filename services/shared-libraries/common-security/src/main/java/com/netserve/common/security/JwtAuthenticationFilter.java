package com.netserve.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // First try: authenticate via Bearer token (direct calls)
        String token = extractToken(request);

        if (StringUtils.hasText(token) && jwtUtil.validateToken(token)) {
            Long userId = jwtUtil.getUserId(token);
            String email = jwtUtil.getEmail(token);
            List<String> roles = jwtUtil.getRoles(token);

            List<SimpleGrantedAuthority> authorities = roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .toList();

            UserPrincipal principal = new UserPrincipal(userId, email, roles);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, authorities);

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        // Second try: authenticate via X-User-* headers (forwarded by API Gateway)
        else {
            String userIdHeader = request.getHeader("X-User-Id");
            String emailHeader = request.getHeader("X-User-Email");
            String rolesHeader = request.getHeader("X-User-Roles");

            System.out.println("JwtAuthFilter ( downstream ) received X-User headers. userId=" + userIdHeader + ", email=" + emailHeader + ", roles=" + rolesHeader);

            if (StringUtils.hasText(userIdHeader)) {
                try {
                    Long userId = Long.parseLong(userIdHeader);
                    String email = emailHeader != null ? emailHeader : "";
                    List<String> roles = StringUtils.hasText(rolesHeader)
                            ? Arrays.asList(rolesHeader.split(","))
                            : List.of("CUSTOMER");

                    List<SimpleGrantedAuthority> authorities = roles.stream()
                            .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                            .toList();

                    UserPrincipal principal = new UserPrincipal(userId, email, roles);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(principal, null, authorities);

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    System.out.println("JwtAuthFilter successfully authenticated user via headers: " + userId);
                } catch (NumberFormatException e) {
                    System.out.println("JwtAuthFilter error parsing userId: " + userIdHeader);
                }
            } else {
                System.out.println("JwtAuthFilter found NO token and NO X-User headers.");
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
