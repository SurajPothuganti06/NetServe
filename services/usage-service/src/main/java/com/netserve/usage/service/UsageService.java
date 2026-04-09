package com.netserve.usage.service;

import com.netserve.common.event.UsageThresholdExceededEvent;
import com.netserve.usage.dto.RecordUsageRequest;
import com.netserve.usage.dto.UsageResponse;
import com.netserve.usage.entity.Device;
import com.netserve.usage.entity.UsageRecord;
import com.netserve.usage.kafka.UsageEventPublisher;
import com.netserve.usage.repository.DeviceRepository;
import com.netserve.usage.repository.UsageRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

import com.netserve.usage.dto.UsageTrendResponse;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsageService {

    private static final double BYTES_PER_GB = 1_073_741_824.0; // 1 GB in bytes
    private static final int THRESHOLD_PERCENT = 80;

    private final UsageRecordRepository usageRecordRepository;
    private final DeviceRepository deviceRepository;
    private final RedisTemplate<String, Long> usageRedisTemplate;
    private final UsageEventPublisher eventPublisher;

    @Transactional
    public void recordUsage(RecordUsageRequest request) {
        Device device = deviceRepository.findById(request.getDeviceId())
                .orElseThrow(() -> new RuntimeException("Device not found"));

        // Persist to PostgreSQL
        UsageRecord record = UsageRecord.builder()
                .customerId(request.getCustomerId())
                .deviceId(request.getDeviceId())
                .downloadBytes(request.getDownloadBytes())
                .uploadBytes(request.getUploadBytes())
                .build();
        usageRecordRepository.save(record);

        // Increment Redis counters (atomic INCRBY)
        String downloadKey = redisKey(request.getCustomerId(), "download");
        String uploadKey = redisKey(request.getCustomerId(), "upload");

        Long currentDownload = usageRedisTemplate.opsForValue().increment(downloadKey, request.getDownloadBytes());
        Long currentUpload = usageRedisTemplate.opsForValue().increment(uploadKey, request.getUploadBytes());

        log.debug("Usage recorded: customerId={}, deviceId={}, dl={} bytes, ul={} bytes",
                request.getCustomerId(), request.getDeviceId(),
                request.getDownloadBytes(), request.getUploadBytes());

        // Check threshold (per-device data cap)
        if (device.getDataCapGb() != null && device.getDataCapGb() > 0 && currentDownload != null && currentUpload != null) {
            double totalGb = (currentDownload + currentUpload) / BYTES_PER_GB;
            int percentUsed = (int) ((totalGb / device.getDataCapGb()) * 100);

            if (percentUsed >= THRESHOLD_PERCENT) {
                eventPublisher.publishUsageThresholdExceeded(UsageThresholdExceededEvent.builder()
                        .customerId(request.getCustomerId())
                        .deviceId(request.getDeviceId())
                        .currentUsageGb(totalGb)
                        .dataCapGb(device.getDataCapGb())
                        .percentUsed(percentUsed)
                        .build());
            }
        }
    }

    /**
     * Get current billing-period usage from Redis counters (real-time).
     */
    public UsageResponse getCurrentUsage(Long customerId) {
        Long downloadBytes = usageRedisTemplate.opsForValue().get(redisKey(customerId, "download"));
        Long uploadBytes = usageRedisTemplate.opsForValue().get(redisKey(customerId, "upload"));

        double dl = downloadBytes != null ? downloadBytes / BYTES_PER_GB : 0;
        double ul = uploadBytes != null ? uploadBytes / BYTES_PER_GB : 0;
        double total = dl + ul;

        Double dataCap = getCombinedDataCap(customerId);
        Integer percentUsed = null;
        if (dataCap != null && dataCap > 0) {
            percentUsed = (int) ((total / dataCap) * 100);
        }

        return UsageResponse.builder()
                .customerId(customerId)
                .downloadGb(round(dl))
                .uploadGb(round(ul))
                .totalGb(round(total))
                .dataCapGb(dataCap)
                .percentUsed(percentUsed)
                .build();
    }

    /**
     * Get historical usage from PostgreSQL for the current billing cycle.
     */
    public UsageResponse getHistoricalUsage(Long customerId) {
        LocalDateTime startOfMonth = LocalDateTime.now()
                .with(TemporalAdjusters.firstDayOfMonth())
                .withHour(0).withMinute(0).withSecond(0).withNano(0);

        Long downloadBytes = usageRecordRepository.sumDownloadBytesByCustomerSince(customerId, startOfMonth);
        Long uploadBytes = usageRecordRepository.sumUploadBytesByCustomerSince(customerId, startOfMonth);

        double dl = downloadBytes != null ? downloadBytes / BYTES_PER_GB : 0;
        double ul = uploadBytes != null ? uploadBytes / BYTES_PER_GB : 0;
        double total = dl + ul;

        Double dataCap = getCombinedDataCap(customerId);
        Integer percentUsed = null;
        if (dataCap != null && dataCap > 0) {
            percentUsed = (int) ((total / dataCap) * 100);
        }

        return UsageResponse.builder()
                .customerId(customerId)
                .downloadGb(round(dl))
                .uploadGb(round(ul))
                .totalGb(round(total))
                .dataCapGb(dataCap)
                .percentUsed(percentUsed)
                .build();
    }

    public List<UsageTrendResponse> getUsageTrend(Long customerId) {
        LocalDateTime sixMonthsAgo = LocalDateTime.now()
                .minusMonths(5)
                .with(TemporalAdjusters.firstDayOfMonth())
                .withHour(0).withMinute(0).withSecond(0).withNano(0);

        List<UsageRecord> records = usageRecordRepository.findByCustomerIdAndRecordedAtAfter(customerId, sixMonthsAgo);

        // Group by month
        Map<String, Double> monthlyUsage = new LinkedHashMap<>();
        
        // Initialize last 6 months with 0
        for (int i = 5; i >= 0; i--) {
            LocalDateTime date = LocalDateTime.now().minusMonths(i);
            String monthName = date.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            monthlyUsage.put(monthName, 0.0);
        }

        for (UsageRecord record : records) {
            String monthName = record.getRecordedAt().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            if (monthlyUsage.containsKey(monthName)) {
                double usage = (record.getDownloadBytes() + record.getUploadBytes()) / BYTES_PER_GB;
                monthlyUsage.put(monthName, monthlyUsage.get(monthName) + usage);
            }
        }

        return monthlyUsage.entrySet().stream()
                .map(e -> UsageTrendResponse.builder()
                        .month(e.getKey())
                        .usageGb(round(e.getValue()))
                        .build())
                .collect(Collectors.toList());
    }

    public Page<UsageRecord> getUsageRecordsByCustomer(Long customerId, Pageable pageable) {
        return usageRecordRepository.findByCustomerId(customerId, pageable);
    }

    @Transactional
    public void deleteUsageDataByCustomerId(Long customerId) {
        usageRecordRepository.deleteByCustomerId(customerId);
        deviceRepository.deleteByCustomerId(customerId);
        log.info("Deleted all usage data and devices for customerId={}", customerId);
    }

    // ─── Helpers ────────────────────────────────────────

    private String redisKey(Long customerId, String type) {
        // Key per billing period: usage:{customerId}:{year-month}:{type}
        String yearMonth = java.time.YearMonth.now().toString();
        return "usage:" + customerId + ":" + yearMonth + ":" + type;
    }

    private Double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private Double getCombinedDataCap(Long customerId) {
        List<Device> devices = deviceRepository.findByCustomerId(customerId);
        Double totalCap = 0.0;
        boolean hasCap = false;
        
        for (Device device : devices) {
            if (device.getDataCapGb() != null) {
                totalCap += device.getDataCapGb();
                hasCap = true;
            }
        }
        
        return hasCap ? totalCap : null;
    }
}
