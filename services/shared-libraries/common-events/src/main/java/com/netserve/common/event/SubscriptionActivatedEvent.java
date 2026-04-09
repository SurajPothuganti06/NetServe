package com.netserve.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SubscriptionActivatedEvent extends BaseEvent {

    private Long subscriptionId;
    private Long customerId;
    private Long planId;
    private String planName;
    private BigDecimal monthlyPrice;
    private String billingCycle; // MONTHLY, QUARTERLY, ANNUALLY
    private LocalDate startDate;
}
