package com.netserve.usage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsageResponse {

    private Long customerId;
    private Long deviceId;
    private Double downloadGb;
    private Double uploadGb;
    private Double totalGb;
    private Double dataCapGb;
    private Integer percentUsed; // null if no cap
}
