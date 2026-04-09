package com.netserve.notification.kafka;

import com.netserve.common.event.*;
import com.netserve.notification.entity.NotificationType;
import com.netserve.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventConsumer {

    private final NotificationService notificationService;

    // ─── Customer Events ───────────────────────────────

    @KafkaListener(topics = EventTopics.CUSTOMER_CREATED, groupId = "notification-service")
    public void onCustomerCreated(BaseEvent event) {
        log.info("Received CustomerCreatedEvent: {}", event.getEventId());
        // Customer ID comes from the event — for generic BaseEvent, extract from metadata
        // In production, use a typed CustomerCreatedEvent
        notificationService.createNotification(
                0L, // placeholder — customer events may not have customerId in BaseEvent
                NotificationType.WELCOME,
                "Welcome to NetServe!",
                "Your account has been created. Explore our plans and get connected.",
                null
        );
    }

    @KafkaListener(topics = EventTopics.CUSTOMER_STATUS_CHANGED, groupId = "notification-service")
    public void onCustomerStatusChanged(BaseEvent event) {
        log.info("Received CustomerStatusChangedEvent: {}", event.getEventId());
        notificationService.createNotification(
                0L,
                NotificationType.STATUS_CHANGE,
                "Account Status Updated",
                "Your account status has been updated. Please check your account settings for details.",
                null
        );
    }

    // ─── Subscription Events ───────────────────────────

    @KafkaListener(topics = EventTopics.SUBSCRIPTION_ACTIVATED, groupId = "notification-service")
    public void onSubscriptionActivated(SubscriptionActivatedEvent event) {
        log.info("Received SubscriptionActivatedEvent: customerId={}, planName={}",
                event.getCustomerId(), event.getPlanName());
        notificationService.createNotification(
                event.getCustomerId(),
                NotificationType.SUBSCRIPTION,
                "Subscription Activated",
                String.format("Your %s plan has been activated! Monthly price: $%s.",
                        event.getPlanName(), event.getMonthlyPrice()),
                "{\"planName\":\"" + event.getPlanName() + "\",\"monthlyPrice\":" + event.getMonthlyPrice() + "}"
        );
    }

    // ─── Billing Events ────────────────────────────────

    @KafkaListener(topics = EventTopics.INVOICE_GENERATED, groupId = "notification-service")
    public void onInvoiceGenerated(InvoiceGeneratedEvent event) {
        log.info("Received InvoiceGeneratedEvent: customerId={}, invoiceId={}",
                event.getCustomerId(), event.getInvoiceId());
        notificationService.createNotification(
                event.getCustomerId(),
                NotificationType.INVOICE,
                "New Invoice Generated",
                String.format("Invoice #%d for $%s has been generated. Due by your billing cycle end date.",
                        event.getInvoiceId(), event.getTotalAmount()),
                "{\"invoiceId\":" + event.getInvoiceId() + ",\"amount\":" + event.getTotalAmount() + "}"
        );
    }

    // ─── Payment Events ────────────────────────────────

    @KafkaListener(topics = EventTopics.PAYMENT_SUCCESSFUL, groupId = "notification-service")
    public void onPaymentSuccessful(PaymentSuccessfulEvent event) {
        log.info("Received PaymentSuccessfulEvent: customerId={}, paymentId={}",
                event.getCustomerId(), event.getPaymentId());
        notificationService.createNotification(
                event.getCustomerId(),
                NotificationType.PAYMENT,
                "Payment Received",
                String.format("Your payment of $%s has been processed successfully. Transaction: %s",
                        event.getAmount(), event.getTransactionRef()),
                "{\"paymentId\":" + event.getPaymentId() + ",\"transactionRef\":\"" + event.getTransactionRef() + "\"}"
        );
    }

    // ─── Usage Events ──────────────────────────────────

    @KafkaListener(topics = EventTopics.USAGE_THRESHOLD_EXCEEDED, groupId = "notification-service")
    public void onUsageThresholdExceeded(UsageThresholdExceededEvent event) {
        log.info("Received UsageThresholdExceededEvent: customerId={}, {}% used",
                event.getCustomerId(), event.getPercentUsed());
        notificationService.createNotification(
                event.getCustomerId(),
                NotificationType.USAGE_ALERT,
                "Data Usage Alert",
                String.format("You've used %d%% of your %.1f GB data cap (%.2f GB used). Consider upgrading your plan.",
                        event.getPercentUsed(), event.getDataCapGb(), event.getCurrentUsageGb()),
                "{\"percentUsed\":" + event.getPercentUsed() + ",\"dataCapGb\":" + event.getDataCapGb() + "}"
        );
    }

    // ─── Support Events ────────────────────────────────

    @KafkaListener(topics = EventTopics.OUTAGE_DECLARED, groupId = "notification-service")
    public void onOutageDeclared(OutageDeclaredEvent event) {
        log.info("Received OutageDeclaredEvent: outageId={}, area={}",
                event.getOutageId(), event.getAffectedArea());
        // Outage events don't target a specific customer — use 0L as broadcast marker
        // In production, you'd query affected customers by area
        notificationService.createNotification(
                0L,
                NotificationType.OUTAGE,
                "Network Outage: " + event.getTitle(),
                String.format("A %s severity outage has been declared in %s. Estimated resolution: %s",
                        event.getSeverity(), event.getAffectedArea(),
                        event.getEstimatedResolution() != null ? event.getEstimatedResolution().toString() : "TBD"),
                "{\"outageId\":" + event.getOutageId() + ",\"area\":\"" + event.getAffectedArea() + "\"}"
        );
    }
}
