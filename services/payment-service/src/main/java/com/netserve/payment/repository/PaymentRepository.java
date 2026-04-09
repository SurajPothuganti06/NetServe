package com.netserve.payment.repository;

import com.netserve.payment.entity.Payment;
import com.netserve.payment.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Page<Payment> findByCustomerId(Long customerId, Pageable pageable);

    List<Payment> findByInvoiceId(Long invoiceId);

    Optional<Payment> findByInvoiceIdAndStatus(Long invoiceId, PaymentStatus status);

    boolean existsByInvoiceIdAndStatusIn(Long invoiceId, List<PaymentStatus> statuses);

    void deleteByCustomerId(Long customerId);
}
