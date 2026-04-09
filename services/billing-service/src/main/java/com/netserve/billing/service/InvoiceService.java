package com.netserve.billing.service;

import com.netserve.billing.dto.GenerateInvoiceRequest;
import com.netserve.billing.dto.InvoiceResponse;
import com.netserve.billing.entity.Invoice;
import com.netserve.billing.entity.InvoiceLineItem;
import com.netserve.billing.entity.InvoiceStatus;
import com.netserve.billing.kafka.BillingEventPublisher;
import com.netserve.billing.repository.InvoiceRepository;
import com.netserve.common.event.InvoiceGeneratedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final BillingEventPublisher eventPublisher;

    @Transactional
    public InvoiceResponse generateInvoice(GenerateInvoiceRequest request) {
        String invoiceNumber = generateInvoiceNumber();
        int dueDays = request.getDueDays() != null ? request.getDueDays() : 30;

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .customerId(request.getCustomerId())
                .subscriptionId(request.getSubscriptionId())
                .status(InvoiceStatus.ISSUED)
                .dueDate(LocalDate.now().plusDays(dueDays))
                .build();

        // Add line item
        String description = request.getDescription() != null
                ? request.getDescription()
                : "Service charge";

        InvoiceLineItem lineItem = InvoiceLineItem.builder()
                .description(description)
                .quantity(1)
                .unitPrice(request.getAmount())
                .totalPrice(request.getAmount())
                .build();

        invoice.addLineItem(lineItem);
        invoice = invoiceRepository.save(invoice);
        log.info("Invoice generated: id={}, number={}, customerId={}", invoice.getId(), invoiceNumber, request.getCustomerId());

        // Publish Kafka event
        eventPublisher.publishInvoiceGenerated(InvoiceGeneratedEvent.builder()
                .invoiceId(invoice.getId())
                .customerId(invoice.getCustomerId())
                .subscriptionId(invoice.getSubscriptionId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .totalAmount(invoice.getTotalAmount())
                .dueDate(invoice.getDueDate())
                .build());

        return toResponse(invoice);
    }

    /**
     * Auto-generate an invoice from a subscription activation event.
     */
    @Transactional
    public InvoiceResponse generateFromSubscription(Long customerId, Long subscriptionId,
                                                     String planName, BigDecimal monthlyPrice, String billingCycle) {
        String invoiceNumber = generateInvoiceNumber();

        BigDecimal totalAmount = calculateBillingAmount(monthlyPrice, billingCycle);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .customerId(customerId)
                .subscriptionId(subscriptionId)
                .status(InvoiceStatus.ISSUED)
                .dueDate(LocalDate.now().plusDays(30))
                .build();

        InvoiceLineItem lineItem = InvoiceLineItem.builder()
                .description(planName + " — " + billingCycle.toLowerCase() + " subscription")
                .quantity(1)
                .unitPrice(totalAmount)
                .totalPrice(totalAmount)
                .build();

        invoice.addLineItem(lineItem);
        invoice = invoiceRepository.save(invoice);
        log.info("Auto-generated invoice from subscription: id={}, subscriptionId={}", invoice.getId(), subscriptionId);

        // Publish Kafka event
        eventPublisher.publishInvoiceGenerated(InvoiceGeneratedEvent.builder()
                .invoiceId(invoice.getId())
                .customerId(invoice.getCustomerId())
                .subscriptionId(invoice.getSubscriptionId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .totalAmount(invoice.getTotalAmount())
                .dueDate(invoice.getDueDate())
                .build());

        return toResponse(invoice);
    }

    public InvoiceResponse getInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        return toResponse(invoice);
    }

    public Page<InvoiceResponse> getInvoicesByCustomer(Long customerId, Pageable pageable) {
        return invoiceRepository.findByCustomerId(customerId, pageable).map(this::toResponse);
    }

    @Transactional
    public InvoiceResponse markAsPaid(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new RuntimeException("Invoice is already paid");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new RuntimeException("Cannot pay a cancelled invoice");
        }

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        invoice = invoiceRepository.save(invoice);
        log.info("Invoice marked as paid: id={}", id);

        return toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse cancelInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new RuntimeException("Cannot cancel a paid invoice");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        invoice = invoiceRepository.save(invoice);
        log.info("Invoice cancelled: id={}", id);

        return toResponse(invoice);
    }

    public Page<InvoiceResponse> getAllInvoices(Pageable pageable) {
        return invoiceRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public void deleteInvoicesByCustomerId(Long customerId) {
        invoiceRepository.deleteByCustomerId(customerId);
        log.info("Deleted all invoices for customerId={}", customerId);
    }

    // ─── Helpers ────────────────────────────────────────

    private String generateInvoiceNumber() {
        return "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private BigDecimal calculateBillingAmount(BigDecimal monthlyPrice, String billingCycle) {
        return switch (billingCycle.toUpperCase()) {
            case "QUARTERLY" -> monthlyPrice.multiply(BigDecimal.valueOf(3));
            case "ANNUALLY" -> monthlyPrice.multiply(BigDecimal.valueOf(12));
            default -> monthlyPrice; // MONTHLY
        };
    }

    // ─── Mapper ────────────────────────────────────────

    private InvoiceResponse toResponse(Invoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .customerId(invoice.getCustomerId())
                .subscriptionId(invoice.getSubscriptionId())
                .totalAmount(invoice.getTotalAmount())
                .status(invoice.getStatus().name())
                .dueDate(invoice.getDueDate())
                .paidAt(invoice.getPaidAt())
                .lineItems(invoice.getLineItems().stream()
                        .map(item -> InvoiceResponse.LineItemResponse.builder()
                                .id(item.getId())
                                .description(item.getDescription())
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                .totalPrice(item.getTotalPrice())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
