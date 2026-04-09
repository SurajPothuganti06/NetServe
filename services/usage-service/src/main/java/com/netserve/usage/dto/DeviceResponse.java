package com.netserve.usage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceResponse {

    private Long id;
    private Long customerId;
    private String macAddress;
    private String deviceName;
    private String deviceType;
    private String status;
    private String assignedIp;
    private Double dataCapGb;
}
