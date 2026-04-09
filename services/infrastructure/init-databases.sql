-- NetServe: Database-per-Service initialization
-- Creates all 8 databases for the microservices

CREATE DATABASE netserve_customer;
CREATE DATABASE netserve_subscription;
CREATE DATABASE netserve_billing;
CREATE DATABASE netserve_payment;
CREATE DATABASE netserve_usage;
CREATE DATABASE netserve_support;
CREATE DATABASE netserve_notification;

-- netserve_auth is created automatically via POSTGRES_DB env var
