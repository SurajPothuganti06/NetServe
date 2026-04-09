package com.netserve.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class UsageThresholdExceededEvent extends BaseEvent {

    private Long customerId;
    private Long deviceId;
    private Double currentUsageGb;
    private Double dataCapGb;
    private Integer percentUsed;
}
