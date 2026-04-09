package com.netserve.subscription.service;

import com.netserve.common.event.SubscriptionActivatedEvent;
import com.netserve.subscription.dto.CreateSubscriptionRequest;
import com.netserve.subscription.dto.SubscriptionResponse;
import com.netserve.subscription.entity.Plan;
import com.netserve.subscription.entity.PlanStatus;
import com.netserve.subscription.entity.Subscription;
import com.netserve.subscription.entity.SubscriptionStatus;
import com.netserve.subscription.kafka.SubscriptionEventPublisher;
import com.netserve.subscription.repository.PlanRepository;
import com.netserve.subscription.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final SubscriptionEventPublisher eventPublisher;
    private final PlanService planService;

    @Transactional
    public SubscriptionResponse createSubscription(CreateSubscriptionRequest request) {
        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        if (plan.getStatus() != PlanStatus.ACTIVE) {
            throw new RuntimeException("Plan is not available for subscription");
        }

        // Check for duplicate active subscriptions
        List<SubscriptionStatus> activeStatuses = List.of(SubscriptionStatus.PENDING, SubscriptionStatus.ACTIVE);
        if (subscriptionRepository.existsByCustomerIdAndPlanIdAndStatusIn(
                request.getCustomerId(), request.getPlanId(), activeStatuses)) {
            throw new RuntimeException("Customer already has an active or pending subscription to this plan");
        }

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = calculateEndDate(startDate, plan);

        Subscription subscription = Subscription.builder()
                .customerId(request.getCustomerId())
                .plan(plan)
                .status(SubscriptionStatus.PENDING)
                .startDate(startDate)
                .endDate(endDate)
                .autoRenew(request.isAutoRenew())
                .build();

        subscription = subscriptionRepository.save(subscription);
        log.info("Subscription created: id={}, customerId={}, planId={}",
                subscription.getId(), subscription.getCustomerId(), plan.getId());

        return toResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse subscribeOrSwitchPlan(Long customerId, Long planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        if (plan.getStatus() != PlanStatus.ACTIVE) {
            throw new RuntimeException("Plan is not available for subscription");
        }

        // Find existing non-cancelled subscriptions
        List<Subscription> existingSubs = subscriptionRepository.findByCustomerIdAndStatusIn(
                customerId, List.of(SubscriptionStatus.PENDING, SubscriptionStatus.ACTIVE));

        for (Subscription sub : existingSubs) {
            if (sub.getPlan().getId().equals(planId)) {
                // Already subscribed to this plan
                return toResponse(sub);
            }
            // If they are changing plans, we cancel the old one
            sub.setStatus(SubscriptionStatus.CANCELLED);
            sub.setEndDate(LocalDate.now());
            subscriptionRepository.save(sub);
            log.info("Cancelled existing subscription {} due to plan switch", sub.getId());
        }

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = calculateEndDate(startDate, plan);

        Subscription subscription = Subscription.builder()
                .customerId(customerId)
                .plan(plan)
                .status(SubscriptionStatus.ACTIVE)
                .startDate(startDate)
                .endDate(endDate)
                .autoRenew(true)
                .build();

        subscription = subscriptionRepository.save(subscription);
        log.info("Subscription created and auto-activated: id={}, customerId={}, planId={}",
                subscription.getId(), subscription.getCustomerId(), plan.getId());

        // Publish event for Billing/Notification
        eventPublisher.publishSubscriptionActivated(SubscriptionActivatedEvent.builder()
                .subscriptionId(subscription.getId())
                .customerId(subscription.getCustomerId())
                .planId(plan.getId())
                .planName(plan.getName())
                .monthlyPrice(plan.getMonthlyPrice())
                .billingCycle(plan.getBillingCycle().name())
                .startDate(subscription.getStartDate())
                .build());

        return toResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse activateSubscription(Long id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        if (subscription.getStatus() != SubscriptionStatus.PENDING) {
            throw new RuntimeException("Only pending subscriptions can be activated");
        }

        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription = subscriptionRepository.save(subscription);
        log.info("Subscription activated: id={}", id);

        // Publish Kafka event
        Plan plan = subscription.getPlan();
        eventPublisher.publishSubscriptionActivated(SubscriptionActivatedEvent.builder()
                .subscriptionId(subscription.getId())
                .customerId(subscription.getCustomerId())
                .planId(plan.getId())
                .planName(plan.getName())
                .monthlyPrice(plan.getMonthlyPrice())
                .billingCycle(plan.getBillingCycle().name())
                .startDate(subscription.getStartDate())
                .build());

        return toResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse suspendSubscription(Long id, String reason) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new RuntimeException("Only active subscriptions can be suspended");
        }

        subscription.setStatus(SubscriptionStatus.SUSPENDED);
        subscription = subscriptionRepository.save(subscription);
        log.info("Subscription suspended: id={}, reason={}", id, reason);

        return toResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse cancelSubscription(Long id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        if (subscription.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new RuntimeException("Subscription is already cancelled");
        }

        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setEndDate(LocalDate.now());
        subscription = subscriptionRepository.save(subscription);
        log.info("Subscription cancelled: id={}", id);

        return toResponse(subscription);
    }

    public SubscriptionResponse getSubscription(Long id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));
        return toResponse(subscription);
    }

    public Page<SubscriptionResponse> getAllSubscriptions(Pageable pageable) {
        return subscriptionRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<SubscriptionResponse> getSubscriptionsByCustomer(Long customerId, Pageable pageable) {
        return subscriptionRepository.findByCustomerId(customerId, pageable).map(this::toResponse);
    }

    @Transactional
    public void deleteSubscriptionsByCustomerId(Long customerId) {
        subscriptionRepository.deleteByCustomerId(customerId);
        log.info("Deleted all subscriptions for customerId={}", customerId);
    }

    // ─── Helpers ────────────────────────────────────────

    private LocalDate calculateEndDate(LocalDate startDate, Plan plan) {
        return switch (plan.getBillingCycle()) {
            case MONTHLY -> startDate.plusMonths(1);
            case QUARTERLY -> startDate.plusMonths(3);
            case ANNUALLY -> startDate.plusYears(1);
        };
    }

    // ─── Mapper ────────────────────────────────────────

    private SubscriptionResponse toResponse(Subscription subscription) {
        return SubscriptionResponse.builder()
                .id(subscription.getId())
                .customerId(subscription.getCustomerId())
                .plan(planService.toResponse(subscription.getPlan()))
                .status(subscription.getStatus().name())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .autoRenew(subscription.isAutoRenew())
                .build();
    }
}
