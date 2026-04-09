package com.netserve.subscription.controller;

import com.netserve.common.dto.ApiResponse;
import com.netserve.common.dto.PagedResponse;
import com.netserve.subscription.dto.CreateSubscriptionRequest;
import com.netserve.subscription.dto.SubscriptionResponse;
import com.netserve.subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> createSubscription(
            @Valid @RequestBody CreateSubscriptionRequest request) {
        SubscriptionResponse response = subscriptionService.createSubscription(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Subscription created", response));
    }

    @PostMapping("/subscribe")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> subscribeOrSwitchPlan(
            @Valid @RequestBody CreateSubscriptionRequest request) {
        SubscriptionResponse response = subscriptionService.subscribeOrSwitchPlan(
                request.getCustomerId(), request.getPlanId());
        return ResponseEntity.ok(ApiResponse.success("Subscription processed successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(subscriptionService.getSubscription(id)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ApiResponse<PagedResponse<SubscriptionResponse>>> getAllSubscriptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SubscriptionResponse> result = subscriptionService.getAllSubscriptions(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(
                PagedResponse.of(result.getContent(), page, size, result.getTotalElements())));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<PagedResponse<SubscriptionResponse>>> getCustomerSubscriptions(
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<SubscriptionResponse> result = subscriptionService
                .getSubscriptionsByCustomer(customerId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(
                PagedResponse.of(result.getContent(), page, size, result.getTotalElements())));
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> activateSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Subscription activated",
                subscriptionService.activateSubscription(id)));
    }

    @PutMapping("/{id}/suspend")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> suspendSubscription(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "") : "";
        return ResponseEntity.ok(ApiResponse.success("Subscription suspended",
                subscriptionService.suspendSubscription(id, reason)));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> cancelSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Subscription cancelled",
                subscriptionService.cancelSubscription(id)));
    }
}
