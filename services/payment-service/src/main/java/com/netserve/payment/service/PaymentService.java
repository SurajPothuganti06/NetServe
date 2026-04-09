package com.netserve.payment.service;

import com.netserve.common.event.PaymentSuccessfulEvent;
import com.netserve.payment.dto.ProcessPaymentRequest;
import com.netserve.payment.dto.PaymentResponse;
import com.netserve.payment.entity.Payment;
import com.netserve.payment.entity.PaymentMethod;
import com.netserve.payment.entity.PaymentStatus;
import com.netserve.payment.gateway.PaymentGateway;
import com.netserve.payment.kafka.PaymentEventPublisher;
import com.netserve.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentEventPublisher eventPublisher;
    private final PaymentGateway paymentGateway;

    @Transactional
    public PaymentResponse processPayment(ProcessPaymentRequest request) {
        // Prevent duplicate completed/processing payments for same invoice
        List<PaymentStatus> activeStatuses = List.of(PaymentStatus.COMPLETED, PaymentStatus.PROCESSING);
        if (paymentRepository.existsByInvoiceIdAndStatusIn(request.getInvoiceId(), activeStatuses)) {
            throw new RuntimeException("Payment already completed or in progress for this invoice");
        }

        PaymentMethod method = PaymentMethod.CREDIT_CARD;
        if (request.getPaymentMethod() != null) {
            method = PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());
        }

        Payment payment = Payment.builder()
                .invoiceId(request.getInvoiceId())
                .customerId(request.getCustomerId())
                .amount(request.getAmount())
                .paymentMethod(method)
                .status(PaymentStatus.PROCESSING)
                .build();

        payment = paymentRepository.save(payment);
        log.info("Payment processing started: id={}, invoiceId={}", payment.getId(), request.getInvoiceId());

        // Process payment via the gateway (SimulatedPaymentGateway in dev,
        // RazorpayPaymentGateway in prod)
        String transactionRef = paymentGateway.processPayment(payment);

        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setTransactionRef(transactionRef);
        payment.setPaidAt(LocalDateTime.now());
        payment = paymentRepository.save(payment);
        log.info("Payment completed: id={}, transactionRef={}", payment.getId(), transactionRef);

        // Publish Kafka event
        eventPublisher.publishPaymentSuccessful(PaymentSuccessfulEvent.builder()
                .paymentId(payment.getId())
                .invoiceId(payment.getInvoiceId())
                .customerId(payment.getCustomerId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod().name())
                .transactionRef(transactionRef)
                .build());

        return toResponse(payment);
    }

    /**
     * Create a PENDING payment record (called by Kafka consumer when an invoice is
     * generated).
     */
    @Transactional
    public PaymentResponse createPendingPayment(Long invoiceId, Long customerId, java.math.BigDecimal amount) {
        Payment payment = Payment.builder()
                .invoiceId(invoiceId)
                .customerId(customerId)
                .amount(amount)
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .status(PaymentStatus.PENDING)
                .build();

        payment = paymentRepository.save(payment);
        log.info("Pending payment created from invoice event: id={}, invoiceId={}", payment.getId(), invoiceId);
        return toResponse(payment);
    }

    public PaymentResponse getPayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        return toResponse(payment);
    }

    public Page<PaymentResponse> getPaymentsByCustomer(Long customerId, Pageable pageable) {
        return paymentRepository.findByCustomerId(customerId, pageable).map(this::toResponse);
    }

    @Transactional
    public PaymentResponse refundPayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new RuntimeException("Only completed payments can be refunded");
        }

        // Process refund via the gateway
        paymentGateway.refundPayment(payment.getTransactionRef());

        payment.setStatus(PaymentStatus.REFUNDED);
        payment = paymentRepository.save(payment);
        log.info("Payment refunded: id={}", id);

        return toResponse(payment);
    }

    @Transactional
    public void deletePaymentsByCustomerId(Long customerId) {
        paymentRepository.deleteByCustomerId(customerId);
        log.info("Deleted all payments for customerId={}", customerId);
    }

    // ─── Mapper ────────────────────────────────────────

    private PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .invoiceId(payment.getInvoiceId())
                .customerId(payment.getCustomerId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod().name())
                .status(payment.getStatus().name())
                .transactionRef(payment.getTransactionRef())
                .failureReason(payment.getFailureReason())
                .paidAt(payment.getPaidAt())
                .build();
    }
}
