package com.netserve.subscription.repository;

import com.netserve.subscription.entity.Plan;
import com.netserve.subscription.entity.PlanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {

    Optional<Plan> findByName(String name);

    boolean existsByName(String name);

    Page<Plan> findByStatus(PlanStatus status, Pageable pageable);
}
