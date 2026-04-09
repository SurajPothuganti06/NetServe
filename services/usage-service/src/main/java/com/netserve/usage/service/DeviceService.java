package com.netserve.usage.service;

import com.netserve.usage.dto.RegisterDeviceRequest;
import com.netserve.usage.dto.DeviceResponse;
import com.netserve.usage.entity.Device;
import com.netserve.usage.entity.DeviceStatus;
import com.netserve.usage.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceService {

    private final DeviceRepository deviceRepository;

    @Transactional
    public DeviceResponse registerDevice(RegisterDeviceRequest request) {
        if (deviceRepository.existsByMacAddress(request.getMacAddress())) {
            throw new RuntimeException("Device with this MAC address already exists");
        }

        Device device = Device.builder()
                .customerId(request.getCustomerId())
                .macAddress(request.getMacAddress())
                .deviceName(request.getDeviceName())
                .deviceType(request.getDeviceType())
                .assignedIp(request.getAssignedIp())
                .dataCapGb(request.getDataCapGb())
                .status(DeviceStatus.ACTIVE)
                .build();

        device = deviceRepository.save(device);
        log.info("Device registered: id={}, mac={}, customerId={}", device.getId(), device.getMacAddress(), device.getCustomerId());
        return toResponse(device);
    }

    public DeviceResponse getDevice(Long id) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Device not found"));
        return toResponse(device);
    }

    public Page<DeviceResponse> getDevicesByCustomer(Long customerId, Pageable pageable) {
        return deviceRepository.findByCustomerId(customerId, pageable).map(this::toResponse);
    }

    @Transactional
    public DeviceResponse updateDeviceStatus(Long id, String status) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        DeviceStatus newStatus = DeviceStatus.valueOf(status.toUpperCase());
        device.setStatus(newStatus);
        device = deviceRepository.save(device);
        log.info("Device status updated: id={}, status={}", id, newStatus);
        return toResponse(device);
    }

    // ─── Mapper ────────────────────────────────────────

    DeviceResponse toResponse(Device device) {
        return DeviceResponse.builder()
                .id(device.getId())
                .customerId(device.getCustomerId())
                .macAddress(device.getMacAddress())
                .deviceName(device.getDeviceName())
                .deviceType(device.getDeviceType())
                .status(device.getStatus().name())
                .assignedIp(device.getAssignedIp())
                .dataCapGb(device.getDataCapGb())
                .build();
    }
}
