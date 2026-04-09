package com.netserve.subscription.config;

import com.netserve.subscription.entity.BillingCycle;
import com.netserve.subscription.entity.Plan;
import com.netserve.subscription.entity.PlanStatus;
import com.netserve.subscription.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class PlanBootstrapper implements CommandLineRunner {

    private final PlanRepository planRepository;

    @Override
    public void run(String... args) {
        if (planRepository.count() == 0) {
            log.info("No plans found in the database. Bootstrapping default plans...");

            Plan basicPlan = Plan.builder()
                    .name("Basic")
                    .description("Essential internet for everyday web browsing and emails.")
                    .monthlyPrice(new BigDecimal("29.99"))
                    .downloadSpeedMbps(50)
                    .uploadSpeedMbps(10)
                    .dataCapGb(500)
                    .billingCycle(BillingCycle.MONTHLY)
                    .status(PlanStatus.ACTIVE)
                    .build();

            Plan standardPlan = Plan.builder()
                    .name("Standard")
                    .description("Perfect for small families, casual streaming, and remote work.")
                    .monthlyPrice(new BigDecimal("49.99"))
                    .downloadSpeedMbps(200)
                    .uploadSpeedMbps(50)
                    .dataCapGb(null) // Unlimited
                    .billingCycle(BillingCycle.MONTHLY)
                    .status(PlanStatus.ACTIVE)
                    .build();

            Plan premiumPlan = Plan.builder()
                    .name("Premium")
                    .description("Ultra-fast speeds for 4K streaming, gaming, and smart homes.")
                    .monthlyPrice(new BigDecimal("79.99"))
                    .downloadSpeedMbps(1000)
                    .uploadSpeedMbps(200)
                    .dataCapGb(null) // Unlimited
                    .billingCycle(BillingCycle.MONTHLY)
                    .status(PlanStatus.ACTIVE)
                    .build();

            planRepository.save(basicPlan);
            planRepository.save(standardPlan);
            planRepository.save(premiumPlan);

            log.info("Successfully bootstrapped default plans: Basic, Standard, Premium.");
        } else {
            log.info("Plans already exist in the database. Skipping bootstrap.");
        }
    }
}
