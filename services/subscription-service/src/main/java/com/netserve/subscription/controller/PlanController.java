package com.netserve.subscription.controller;

import com.netserve.common.dto.ApiResponse;
import com.netserve.common.dto.PagedResponse;
import com.netserve.subscription.dto.CreatePlanRequest;
import com.netserve.subscription.dto.PlanResponse;
import com.netserve.subscription.service.PlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PlanResponse>> createPlan(
            @Valid @RequestBody CreatePlanRequest request) {
        PlanResponse response = planService.createPlan(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Plan created", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlanResponse>> getPlan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(planService.getPlan(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<PlanResponse>>> getAllPlans(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        Page<PlanResponse> result;
        if (status != null) {
            result = planService.getPlansByStatus(status, PageRequest.of(page, size));
        } else {
            result = planService.getAllPlans(PageRequest.of(page, size));
        }
        return ResponseEntity.ok(ApiResponse.success(
                PagedResponse.of(result.getContent(), page, size, result.getTotalElements())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PlanResponse>> updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody CreatePlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Plan updated",
                planService.updatePlan(id, request)));
    }

    @PutMapping("/{id}/deprecate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PlanResponse>> deprecatePlan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Plan deprecated",
                planService.deprecatePlan(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) {
        planService.deletePlan(id);
        return ResponseEntity.ok(ApiResponse.success("Plan deleted", null));
    }
}
