package com.netserve.subscription.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePlanRequest {

    @NotBlank(message = "Plan name is required")
    private String name;

    private String description;

    @NotNull(message = "Monthly price is required")
    @Positive(message = "Monthly price must be positive")
    private BigDecimal monthlyPrice;

    @NotNull(message = "Download speed is required")
    @Positive(message = "Download speed must be positive")
    private Integer downloadSpeedMbps;

    @NotNull(message = "Upload speed is required")
    @Positive(message = "Upload speed must be positive")
    private Integer uploadSpeedMbps;

    private Integer dataCapGb; // null = unlimited

    private String billingCycle; // MONTHLY, QUARTERLY, ANNUALLY
}
