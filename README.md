# 🌐 NetServe — ISP Management Platform

A distributed **Internet Service Provider (ISP) SaaS platform** built with a microservices architecture. NetServe provides end-to-end tooling for customer onboarding, subscription management, billing, usage tracking, support ticketing, and real-time notifications.

---

## ✨ Features

- **Customer Management** — Full lifecycle from onboarding to account management
- **Authentication & Authorization** — JWT-based auth with refresh tokens, role-based access control, and Redis-backed sessions
- **Subscription Management** — Plan activation, upgrades, downgrades, and renewals
- **Automated Billing** — Invoice generation with partitioned tables for high-volume data
- **Payment Processing** — Razorpay integration for seamless payments
- **Usage Metering** — Real-time bandwidth/data tracking with Redis counters and threshold alerts
- **Support Ticketing** — Outage declarations and customer support workflows
- **Notifications** — Event-driven notifications via Kafka consumers
- **API Gateway** — Centralized routing with JWT forwarding and Redis-backed rate limiting

---

## 🏗️ Architecture

NetServe follows a **database-per-service** pattern with asynchronous inter-service communication over **Apache Kafka**.

```
┌──────────────┐
│   Frontend   │  Next.js · TailwindCSS · React Query
│   :3000      │
└──────┬───────┘
       │
┌──────▼───────┐
│  API Gateway │  Spring Cloud Gateway · JWT · Rate Limiting
│   :8080      │
└──────┬───────┘
       │
┌──────▼────────────────────────────────────────────────────────┐
│                     Microservices                             │
│                                                               │
│  Auth (:8081)  ·  Customer (:8082)  ·  Subscription (:8083)  │
│  Billing (:8084)  ·  Payment (:8085)  ·  Usage (:8086)       │
│  Support (:8087)  ·  Notification (:8088)                    │
└──────┬──────────────────┬──────────────────┬─────────────────┘
       │                  │                  │
  PostgreSQL 16       Apache Kafka        Redis 7
  (per-service DB)    (event bus)         (cache/rate-limit)
```

> For a detailed breakdown of Kafka topics, shared libraries, and service responsibilities, see [`docs/architecture.md`](docs/architecture.md).

---

## 🛠️ Tech Stack

| Layer           | Technology                                                 |
| --------------- | ---------------------------------------------------------- |
| **Frontend**    | Next.js (App Router), TailwindCSS, React Query, TypeScript |
| **Backend**     | Java 21, Spring Boot 3, Spring Security, Spring Data JPA   |
| **API Gateway** | Spring Cloud Gateway                                       |
| **Database**    | PostgreSQL 16 (database-per-service)                       |
| **Messaging**   | Apache Kafka (Confluent 7.6)                               |
| **Caching**     | Redis 7                                                    |
| **Payments**    | Razorpay API                                               |
| **Build**       | Maven (multi-module), npm                                  |
| **Containers**  | Docker & Docker Compose                                    |

---

## 📁 Project Structure

```
netServe/
├── frontend/                    # Next.js frontend application
├── services/
│   ├── shared-libraries/        # Common DTOs, events, security utilities
│   │   ├── common-dto/          #   ApiResponse<T>, PagedResponse<T>, ErrorResponse
│   │   ├── common-events/       #   BaseEvent, Kafka event classes, EventTopics
│   │   └── common-security/     #   JwtUtil, JwtAuthenticationFilter, UserPrincipal, Role
│   ├── api-gateway/             # Spring Cloud Gateway  (port 8080)
│   ├── auth-service/            # Authentication & JWT   (port 8081)
│   ├── customer-service/        # Customer management    (port 8082)
│   ├── subscription-service/    # Plan management        (port 8083)
│   ├── billing-service/         # Invoice generation     (port 8084)
│   ├── payment-service/         # Razorpay payments      (port 8085)
│   ├── usage-service/           # Bandwidth metering     (port 8086)
│   ├── support-service/         # Support ticketing      (port 8087)
│   ├── notification-service/    # Event-driven alerts    (port 8088)
│   └── infrastructure/          # Docker Compose & init scripts
├── docs/                        # Architecture documentation
└── pom.xml                      # Parent POM (Maven multi-module)
```

---

## 🚀 Getting Started

### Prerequisites

| Tool             | Version |
| ---------------- | ------- |
| Java (JDK)       | 21+     |
| Maven            | 3.9+    |
| Node.js          | 18+     |
| Docker & Compose | Latest  |

### 1. Clone the repository

```bash
git clone https://github.com/kailashmannem/netServe.git
cd netServe
```

### 2. Start infrastructure (PostgreSQL, Kafka, Redis)

```bash
cd services/infrastructure
docker compose up -d
```

This will:

- Spin up **PostgreSQL 16** and create per-service databases via `init-databases.sql`
- Start a **Kafka** broker (with Zookeeper) and auto-create all required topics
- Launch **Redis 7** with password authentication

### 3. Build the backend

```bash
# From the project root
mvn clean install
```

### 4. Run services

Start each service individually (or use your IDE's run configurations):

```bash
# Auth Service
cd services/auth-service
mvn spring-boot:run

# Customer Service
cd services/customer-service
mvn spring-boot:run

# API Gateway
cd services/api-gateway
mvn spring-boot:run
```

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at **http://localhost:3000**.

---

## 🔐 Environment & Configuration

Each service reads configuration from its own `application.yml`. Key values for local development:

| Variable                   | Default                             |
| -------------------------- | ----------------------------------- |
| PostgreSQL URL             | `localhost:5432`                    |
| PostgreSQL User / Password | `netserve` / `netserve_secret`      |
| Redis Host / Password      | `localhost:6379` / `netserve_redis` |
| Kafka Bootstrap Server     | `localhost:9092`                    |
| JWT Secret                 | _(configured in auth-service)_      |

> **Note:** For production, replace all secrets with environment variables or a secrets manager.

---

## 📊 Kafka Event Bus

Services communicate asynchronously through Kafka topics:

| Topic                      | Publisher            | Consumer(s)           |
| -------------------------- | -------------------- | --------------------- |
| `customer-created`         | Customer Service     | Notification          |
| `customer-status-changed`  | Customer Service     | Notification          |
| `subscription-activated`   | Subscription Service | Notification, Billing |
| `invoice-generated`        | Billing Service      | Notification, Payment |
| `payment-successful`       | Payment Service      | Notification, Billing |
| `usage-threshold-exceeded` | Usage Service        | Notification          |
| `outage-declared`          | Support Service      | Notification          |

---

## 🗺️ Roadmap

- [x] **Phase 1** — Auth Service, Customer Service, API Gateway, Shared Libraries
- [ ] **Phase 2** — Subscription Service, Billing Service
- [ ] **Phase 3** — Payment Service (Razorpay), Usage Service
- [ ] **Phase 4** — Support Service, Notification Service
- [ ] **Phase 5** — Frontend dashboard, end-to-end integration
- [ ] **Phase 6** — CI/CD pipeline, Kubernetes deployment manifests

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

© 2026 Kailash Chandra
