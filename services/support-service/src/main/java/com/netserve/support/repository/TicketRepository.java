package com.netserve.support.repository;

import com.netserve.support.entity.Ticket;
import com.netserve.support.entity.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Page<Ticket> findByCustomerId(Long customerId, Pageable pageable);

    Page<Ticket> findByCustomerIdAndStatus(Long customerId, TicketStatus status, Pageable pageable);

    Page<Ticket> findByStatus(TicketStatus status, Pageable pageable);

    Page<Ticket> findByAssignedTo(String assignedTo, Pageable pageable);

    void deleteByCustomerId(Long customerId);
}
