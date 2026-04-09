# NetServe — Architecture

## Overview

NetServe is a **distributed ISP SaaS platform** built as a microservices architecture.
All services run as Docker containers with database-per-service isolation.

## Layers

| Layer | Technology | Port(s) |
|---|---|---|
| Frontend | Next.js (App Router), TailwindCSS, React Query | 3000 |
| API Gateway | Spring Cloud Gateway (JWT forwarding, Redis rate limiting) | 8080 |
| Auth Service | Spring Boot + Spring Security + JWT + Redis sessions | 8081 |
| Customer Service | Spring Boot + JPA + Kafka publisher | 8082 |
| Subscription Service | Spring Boot + JPA + Kafka | 8083 |
| Billing Service | Spring Boot + JPA + partitioned tables + Kafka | 8084 |
| Payment Service | Spring Boot + Razorpay + Kafka | 8085 |
| Usage Service | Spring Boot + Redis counters + partitioned tables + Kafka | 8086 |
| Support Service | Spring Boot + JPA + Kafka | 8087 |
| Notification Service | Spring Boot + Kafka consumer + Redis queue | 8088 |

## Infrastructure

- **PostgreSQL 16**: Database-per-service (8 databases)
- **Apache Kafka**: Event bus for async inter-service communication
- **Redis 7**: Session caching, usage counters, rate limiting, notification queue
- **Docker Compose**: Local development orchestration

## Event Bus (Kafka Topics)

| Topic | Publisher | Consumer(s) |
|---|---|---|
| `customer-created` | Customer Service | Notification Service |
| `customer-status-changed` | Customer Service | Notification Service |
| `subscription-activated` | Subscription Service | Notification, Billing |
| `invoice-generated` | Billing Service | Notification, Payment |
| `payment-successful` | Payment Service | Notification, Billing |
| `usage-threshold-exceeded` | Usage Service | Notification |
| `outage-declared` | Support Service | Notification |

## Shared Libraries

- **common-dto**: `ApiResponse<T>`, `PagedResponse<T>`, `ErrorResponse`
- **common-events**: `BaseEvent`, Kafka event classes, `EventTopics` constants
- **common-security**: `JwtUtil`, `JwtAuthenticationFilter`, `UserPrincipal`, `Role` enum