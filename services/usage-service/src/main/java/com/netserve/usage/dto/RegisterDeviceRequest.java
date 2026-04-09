package com.netserve.usage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class RegisterDeviceRequest {

    @NotNull(message = "Customer ID is required")
    @Positive(message = "Customer ID must be positive")
    private Long customerId;

    @NotBlank(message = "MAC address is required")
    private String macAddress;

    @NotBlank(message = "Device name is required")
    private String deviceName;

    private String deviceType;

    private String assignedIp;

    private Double dataCapGb;
}
