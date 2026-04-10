package com.netserve.support.controller;

import com.netserve.common.dto.ApiResponse;
import com.netserve.common.dto.PagedResponse;
import com.netserve.support.dto.CreateTicketRequest;
import com.netserve.support.dto.TicketResponse;
import com.netserve.support.service.TicketService;
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
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ApiResponse<PagedResponse<TicketResponse>>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TicketResponse> result = ticketService.getAllTickets(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(
                PagedResponse.of(result.getContent(), page, size, result.getTotalElements())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TicketResponse>> createTicket(
            @Valid @RequestBody CreateTicketRequest request) {
        TicketResponse response = ticketService.createTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ticket created", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.getTicket(id)));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<PagedResponse<TicketResponse>>> getCustomerTickets(
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TicketResponse> result = ticketService.getTicketsByCustomer(customerId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(
                PagedResponse.of(result.getContent(), page, size, result.getTotalElements())));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ApiResponse<PagedResponse<TicketResponse>>> getTicketsByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TicketResponse> result = ticketService.getTicketsByStatus(status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(
                PagedResponse.of(result.getContent(), page, size, result.getTotalElements())));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ApiResponse<TicketResponse>> assignTicket(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String assignedTo = body.getOrDefault("assignedTo", "");
        return ResponseEntity.ok(ApiResponse.success("Ticket assigned",
                ticketService.assignTicket(id, assignedTo)));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ApiResponse<TicketResponse>> resolveTicket(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String resolution = body.getOrDefault("resolution", "");
        return ResponseEntity.ok(ApiResponse.success("Ticket resolved",
                ticketService.resolveTicket(id, resolution)));
    }

    @PutMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public ResponseEntity<ApiResponse<TicketResponse>> closeTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Ticket closed",
                ticketService.closeTicket(id)));
    }
}
