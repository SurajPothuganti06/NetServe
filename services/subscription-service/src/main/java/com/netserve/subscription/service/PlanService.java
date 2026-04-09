package com.netserve.subscription.service;

import com.netserve.subscription.dto.CreatePlanRequest;
import com.netserve.subscription.dto.PlanResponse;
import com.netserve.subscription.entity.BillingCycle;
import com.netserve.subscription.entity.Plan;
import com.netserve.subscription.entity.PlanStatus;
import com.netserve.subscription.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanService {

    private final PlanRepository planRepository;

    @Transactional
    public PlanResponse createPlan(CreatePlanRequest request) {
        if (planRepository.existsByName(request.getName())) {
            throw new RuntimeException("Plan with this name already exists");
        }

        BillingCycle billingCycle = BillingCycle.MONTHLY;
        if (request.getBillingCycle() != null) {
            billingCycle = BillingCycle.valueOf(request.getBillingCycle().toUpperCase());
        }

        Plan plan = Plan.builder()
                .name(request.getName())
                .description(request.getDescription())
                .monthlyPrice(request.getMonthlyPrice())
                .downloadSpeedMbps(request.getDownloadSpeedMbps())
                .uploadSpeedMbps(request.getUploadSpeedMbps())
                .dataCapGb(request.getDataCapGb())
                .billingCycle(billingCycle)
                .status(PlanStatus.ACTIVE)
                .build();

        plan = planRepository.save(plan);
        log.info("Plan created: id={}, name={}", plan.getId(), plan.getName());
        return toResponse(plan);
    }

    public PlanResponse getPlan(Long id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));
        return toResponse(plan);
    }

    public Page<PlanResponse> getAllPlans(Pageable pageable) {
        return planRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<PlanResponse> getPlansByStatus(String status, Pageable pageable) {
        PlanStatus planStatus = PlanStatus.valueOf(status.toUpperCase());
        return planRepository.findByStatus(planStatus, pageable).map(this::toResponse);
    }

    @Transactional
    public PlanResponse updatePlan(Long id, CreatePlanRequest request) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        if (request.getName() != null)
            plan.setName(request.getName());
        if (request.getDescription() != null)
            plan.setDescription(request.getDescription());
        if (request.getMonthlyPrice() != null)
            plan.setMonthlyPrice(request.getMonthlyPrice());
        if (request.getDownloadSpeedMbps() != null)
            plan.setDownloadSpeedMbps(request.getDownloadSpeedMbps());
        if (request.getUploadSpeedMbps() != null)
            plan.setUploadSpeedMbps(request.getUploadSpeedMbps());
        if (request.getDataCapGb() != null)
            plan.setDataCapGb(request.getDataCapGb());
        if (request.getBillingCycle() != null)
            plan.setBillingCycle(BillingCycle.valueOf(request.getBillingCycle().toUpperCase()));

        plan = planRepository.save(plan);
        log.info("Plan updated: id={}", plan.getId());
        return toResponse(plan);
    }

    @Transactional
    public PlanResponse deprecatePlan(Long id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        if (plan.getStatus() == PlanStatus.DEPRECATED) {
            throw new RuntimeException("Plan is already deprecated");
        }

        plan.setStatus(PlanStatus.DEPRECATED);
        plan = planRepository.save(plan);
        log.info("Plan deprecated: id={}, name={}", plan.getId(), plan.getName());
        return toResponse(plan);
    }

    @Transactional
    public void deletePlan(Long id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));
        planRepository.delete(plan);
        log.info("Plan deleted: id={}", id);
    }
    
    // ─── Mapper ────────────────────────────────────────

    PlanResponse toResponse(Plan plan) {
        return PlanResponse.builder()
                .id(plan.getId())
                .name(plan.getName())
                .description(plan.getDescription())
                .monthlyPrice(plan.getMonthlyPrice())
                .downloadSpeedMbps(plan.getDownloadSpeedMbps())
                .uploadSpeedMbps(plan.getUploadSpeedMbps())
                .dataCapGb(plan.getDataCapGb())
                .billingCycle(plan.getBillingCycle().name())
                .status(plan.getStatus().name())
                .build();
    }
}
