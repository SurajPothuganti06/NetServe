package com.netserve.gateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Data
@Component
@ConfigurationProperties(prefix = "netserve.gateway")
public class NetServeGatewayProperties {

    /**
     * List of URL patterns that bypass JWT authentication.
     * Bound from netserve.gateway.public-paths in application.yml.
     */
    private List<String> publicPaths = List.of();
}
