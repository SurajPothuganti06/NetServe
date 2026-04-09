package com.netserve.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal monthlyPrice;
    private Integer downloadSpeedMbps;
    private Integer uploadSpeedMbps;
    private Integer dataCapGb;
    private String billingCycle;
    private String status;
}
