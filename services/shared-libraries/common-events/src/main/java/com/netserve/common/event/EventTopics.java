package com.netserve.common.event;

public final class EventTopics {

    private EventTopics() {
    }

    public static final String CUSTOMER_CREATED = "customer-created";
    public static final String CUSTOMER_STATUS_CHANGED = "customer-status-changed";
    public static final String SUBSCRIPTION_ACTIVATED = "subscription-activated";
    public static final String INVOICE_GENERATED = "invoice-generated";
    public static final String PAYMENT_SUCCESSFUL = "payment-successful";
    public static final String USAGE_THRESHOLD_EXCEEDED = "usage-threshold-exceeded";
    public static final String OUTAGE_DECLARED = "outage-declared";
    public static final String USER_DELETED = "user-deleted";
    public static final String CUSTOMER_DELETED = "customer-deleted";
}
