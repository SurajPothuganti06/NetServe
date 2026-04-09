package com.netserve.common.security;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class UserPrincipal {

    private Long userId;
    private String email;
    private List<String> roles;
}
