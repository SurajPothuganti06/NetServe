package com.netserve.usage.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class RecordUsageRequest {

    @NotNull(message = "Customer ID is required")
    @Positive(message = "Customer ID must be positive")
    private Long customerId;

    @NotNull(message = "Device ID is required")
    @Positive(message = "Device ID must be positive")
    private Long deviceId;

    @NotNull(message = "Download bytes is required")
    @PositiveOrZero(message = "Download bytes must be non-negative")
    private Long downloadBytes;

    @NotNull(message = "Upload bytes is required")
    @PositiveOrZero(message = "Upload bytes must be non-negative")
    private Long uploadBytes;
}
