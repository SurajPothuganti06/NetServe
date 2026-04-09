package com.netserve.customer.controller;

import com.netserve.common.dto.ApiResponse;
import com.netserve.common.dto.PagedResponse;
import com.netserve.common.security.UserPrincipal;
import com.netserve.customer.dto.*;
import com.netserve.customer.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (request.getUserId() == null)
            request.setUserId(principal.getUserId());
        CustomerResponse response = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Customer created", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(customerService.getCustomer(id)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CustomerResponse>> getMyProfile(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                customerService.getCustomerByUserId(principal.getUserId())));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ApiResponse<PagedResponse<CustomerResponse>>> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<CustomerResponse> result = customerService.getAllCustomers(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(
                PagedResponse.of(result.getContent(), page, size, result.getTotalElements())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @PathVariable Long id,
            @RequestBody UpdateCustomerRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Customer updated",
                customerService.updateCustomer(id, request)));
    }

    @PutMapping("/{id}/address")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAddressRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Address updated",
                customerService.updateAddress(id, request)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String reason = body.getOrDefault("reason", "");
        return ResponseEntity.ok(ApiResponse.success("Status updated",
                customerService.updateStatus(id, status, reason)));
    }

    @PostMapping("/{id}/upgrade-business")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerResponse>> upgradeToBusiness(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Upgraded to business",
                customerService.upgradeToBusiness(id)));
    }

    @GetMapping("/service-availability/{zipCode}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkServiceAvailability(
            @PathVariable String zipCode) {
        boolean available = customerService.checkServiceAvailability(zipCode);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("zipCode", zipCode, "available", available)));
    }
}
