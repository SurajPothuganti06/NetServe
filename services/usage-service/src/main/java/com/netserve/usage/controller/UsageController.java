package com.netserve.usage.controller;

import com.netserve.common.dto.ApiResponse;
import com.netserve.usage.dto.RecordUsageRequest;
import com.netserve.usage.dto.UsageResponse;
import com.netserve.usage.dto.UsageTrendResponse;
import com.netserve.usage.service.UsageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/usage")
@RequiredArgsConstructor
public class UsageController {

    private final UsageService usageService;

    @PostMapping("/record")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> recordUsage(
            @Valid @RequestBody RecordUsageRequest request) {
        usageService.recordUsage(request);
        return ResponseEntity.ok(ApiResponse.success("Usage recorded", null));
    }

    @GetMapping("/current/{customerId}")
    public ResponseEntity<ApiResponse<UsageResponse>> getCurrentUsage(@PathVariable Long customerId) {
        return ResponseEntity.ok(ApiResponse.success(usageService.getCurrentUsage(customerId)));
    }

    @GetMapping("/history/{customerId}")
    public ResponseEntity<ApiResponse<UsageResponse>> getHistoricalUsage(@PathVariable Long customerId) {
        return ResponseEntity.ok(ApiResponse.success(usageService.getHistoricalUsage(customerId)));
    }

    @GetMapping("/history/trend/{customerId}")
    public ResponseEntity<ApiResponse<List<UsageTrendResponse>>> getUsageTrend(@PathVariable Long customerId) {
        return ResponseEntity.ok(ApiResponse.success(usageService.getUsageTrend(customerId)));
    }
}
