# ─── NetServe Java Microservice Dockerfile ───────────────────────
# Usage: docker build --build-arg SERVICE_NAME=auth-service -f services/Dockerfile .
# Build context must be the project root (d:\Projects\netServe)

# ════════════════════════════════════════════════════════════════
# Stage 1 — Build
# ════════════════════════════════════════════════════════════════
FROM maven:3.9-eclipse-temurin-21 AS build
ARG SERVICE_NAME

WORKDIR /app

# 1. Install shared-libraries into local Maven repo.
#    We do NOT copy the root pom.xml (it references all 9 services which
#    aren't in this build context). Instead we install each sub-module
#    directly by pointing -f at its own pom.xml.
COPY services/shared-libraries services/shared-libraries
RUN mvn install -f services/shared-libraries/pom.xml -DskipTests -N -q && \
    mvn install -f services/shared-libraries/common-dto/pom.xml -DskipTests -q && \
    mvn install -f services/shared-libraries/common-security/pom.xml -DskipTests -q && \
    mvn install -f services/shared-libraries/common-events/pom.xml -DskipTests -q

# 2. Copy the target service's POM first (dependency-caching layer)
COPY services/${SERVICE_NAME}/pom.xml services/${SERVICE_NAME}/pom.xml
RUN mvn dependency:go-offline -f services/${SERVICE_NAME}/pom.xml -q || true

# 3. Copy service source and build the fat JAR
COPY services/${SERVICE_NAME}/src services/${SERVICE_NAME}/src
RUN mvn package -f services/${SERVICE_NAME}/pom.xml -DskipTests -q

# ════════════════════════════════════════════════════════════════
# Stage 2 — Runtime
# ════════════════════════════════════════════════════════════════
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S netserve && adduser -S netserve -G netserve
USER netserve

ARG SERVICE_NAME
COPY --from=build /app/services/${SERVICE_NAME}/target/*.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
