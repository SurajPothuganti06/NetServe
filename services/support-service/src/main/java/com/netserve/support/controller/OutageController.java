package com.netserve.support.controller;

import com.netserve.common.dto.ApiResponse;
import com.netserve.support.dto.DeclareOutageRequest;
import com.netserve.support.dto.OutageResponse;
import com.netserve.support.service.OutageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/outages")
@RequiredArgsConstructor
public class OutageController {

    private final OutageService outageService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ApiResponse<OutageResponse>> declareOutage(
            @Valid @RequestBody DeclareOutageRequest request) {
        OutageResponse response = outageService.declareOutage(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Outage declared", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OutageResponse>> getOutage(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(outageService.getOutage(id)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<OutageResponse>>> getActiveOutages() {
        return ResponseEntity.ok(ApiResponse.success(outageService.getActiveOutages()));
    }

    @PutMapping("/{id}/update")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ApiResponse<OutageResponse>> updateOutageStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "INVESTIGATING");
        return ResponseEntity.ok(ApiResponse.success("Outage status updated",
                outageService.updateOutageStatus(id, status)));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ApiResponse<OutageResponse>> resolveOutage(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Outage resolved",
                outageService.resolveOutage(id)));
    }
}
