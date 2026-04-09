package com.netserve.subscription.repository;

import com.netserve.subscription.entity.Subscription;
import com.netserve.subscription.entity.SubscriptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByCustomerId(Long customerId);

    Page<Subscription> findByCustomerId(Long customerId, Pageable pageable);

    List<Subscription> findByCustomerIdAndStatus(Long customerId, SubscriptionStatus status);

    List<Subscription> findByCustomerIdAndStatusIn(Long customerId, List<SubscriptionStatus> statuses);

    boolean existsByCustomerIdAndPlanIdAndStatusIn(Long customerId, Long planId, List<SubscriptionStatus> statuses);

    void deleteByCustomerId(Long customerId);
}
