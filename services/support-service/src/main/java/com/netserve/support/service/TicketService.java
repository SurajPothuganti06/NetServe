package com.netserve.support.service;

import com.netserve.support.dto.CreateTicketRequest;
import com.netserve.support.dto.TicketResponse;
import com.netserve.support.entity.Ticket;
import com.netserve.support.entity.TicketCategory;
import com.netserve.support.entity.TicketPriority;
import com.netserve.support.entity.TicketStatus;
import com.netserve.support.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request) {
        Ticket ticket = Ticket.builder()
                .customerId(request.getCustomerId())
                .subject(request.getSubject())
                .description(request.getDescription())
                .category(TicketCategory.valueOf(request.getCategory().toUpperCase()))
                .priority(TicketPriority.valueOf(request.getPriority().toUpperCase()))
                .status(TicketStatus.OPEN)
                .build();

        ticket = ticketRepository.save(ticket);
        log.info("Ticket created: id={}, customerId={}, category={}",
                ticket.getId(), ticket.getCustomerId(), ticket.getCategory());
        return toResponse(ticket);
    }

    public TicketResponse getTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        return toResponse(ticket);
    }

    public Page<TicketResponse> getTicketsByCustomer(Long customerId, Pageable pageable) {
        return ticketRepository.findByCustomerId(customerId, pageable).map(this::toResponse);
    }

    public Page<TicketResponse> getAllTickets(Pageable pageable) {
        return ticketRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<TicketResponse> getTicketsByStatus(String status, Pageable pageable) {
        return ticketRepository.findByStatus(TicketStatus.valueOf(status.toUpperCase()), pageable)
                .map(this::toResponse);
    }

    @Transactional
    public TicketResponse assignTicket(Long id, String assignedTo) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setAssignedTo(assignedTo);
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket = ticketRepository.save(ticket);
        log.info("Ticket assigned: id={}, assignedTo={}", id, assignedTo);
        return toResponse(ticket);
    }

    @Transactional
    public TicketResponse resolveTicket(Long id, String resolution) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolution(resolution);
        ticket = ticketRepository.save(ticket);
        log.info("Ticket resolved: id={}", id);
        return toResponse(ticket);
    }

    @Transactional
    public TicketResponse closeTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (ticket.getStatus() != TicketStatus.RESOLVED) {
            throw new RuntimeException("Only resolved tickets can be closed");
        }

        ticket.setStatus(TicketStatus.CLOSED);
        ticket = ticketRepository.save(ticket);
        log.info("Ticket closed: id={}", id);
        return toResponse(ticket);
    }

    @Transactional
    public void deleteTicketsByCustomerId(Long customerId) {
        ticketRepository.deleteByCustomerId(customerId);
        log.info("Deleted all tickets for customerId={}", customerId);
    }

    // ─── Mapper ────────────────────────────────────────

    private TicketResponse toResponse(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .customerId(ticket.getCustomerId())
                .subject(ticket.getSubject())
                .description(ticket.getDescription())
                .category(ticket.getCategory().name())
                .priority(ticket.getPriority().name())
                .status(ticket.getStatus().name())
                .assignedTo(ticket.getAssignedTo())
                .resolution(ticket.getResolution())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
