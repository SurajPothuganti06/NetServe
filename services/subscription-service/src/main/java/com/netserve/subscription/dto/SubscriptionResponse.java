package com.netserve.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {

    private Long id;
    private Long customerId;
    private PlanResponse plan;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean autoRenew;
}
