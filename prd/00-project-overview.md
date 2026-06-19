# Modular Mart - Project Overview

## Summary

Modular Mart is a cloud-native, microservices-based e-commerce platform built to explore modern architectural patterns. The system has evolved from a learning foundation into a functional **multi-vendor marketplace** featuring domain isolation, event-driven choreography, and comprehensive observability.

## Project Context

This project focuses on:

- **Microservices Architecture**: Implementing database-per-service and choreographed sagas.
- **Multi-vendor Marketplace**: Enabling multiple sellers to list and manage their own product catalogs.
- **Event-Driven Patterns**: Leveraging RabbitMQ for reliable asynchronous communication.
- **Observability**: Full stack integration with Loki, Grafana, Prometheus, and Jaeger.
- **Cloud-Native Deployment**: Production-ready containerization and CI/CD workflows.

## Learning Goals (Completed & Ongoing)

### Core Objectives Achieved

1. **Microservices Patterns**: Successfully implemented database-per-service, saga, and outbox patterns.
2. **Multi-vendor logic**: Built complex order splitting and seller-specific inventory management.
3. **Payment Integration**: Full Stripe integration with client-side confirmation and webhook processing.
4. **Full-Stack Observability**: Deployed and verified the full LGTM stack for production-grade monitoring.
5. **Real-time Updates**: Implemented SSE-based notification engine for live user feedback.

### Ongoing Refinement

1. **Operational Efficiency**: Automated scaling and resource optimization.
2. **Advanced Security**: Enhanced RBAC and API protection strategies.
3. **Data-Driven Analytics**: Building deep insights for sellers and administrators.

## Current Status

### ✅ Completed & Working

- **Core Architecture**: Microservices foundation with Turborepo monorepo.
- **API Gateway**: Kong Gateway (OSS) for central entry point, Redis-backed rate limiting, and proxy caching.
- **User Service**: Identity management with Clerk and local profile syncing.
- **Catalog Service**: Multi-vendor product management with approval workflows.
- **Order Service**: Transactional outbox-based saga with seller-specific order splits.
- **Payment Service**: Stripe integration with idempotent webhook handling.
- **Notification Service**: Multi-channel delivery (Email, SSE, In-App) with template management.
- **Web Frontend**: Next.js 14 storefront with dedicated **Customer** and **Seller** hubs.
- **Observability**: Fully operational **LGTM** stack.

### 🚧 In Progress

- **Performance Optimization**: Redis-based caching layer for the catalog.
- **Infrastructure Automation**: Complete Terraform-based IaC for cloud deployment.

### 📚 Future Roadmap

- **Advanced Analytics**: BigQuery/ELK integration for deep business intelligence.
- **Mobile Experience**: Dedicated React Native application.

## Key Metrics (Verified)

- **Availability Target**: 99.9% uptime.
- **Response Time**: <200ms for 95% of gateway requests.
- **Scalability**: Designed for 10,000+ simultaneous users across isolated domains.
- **Data Integrity**: Atomicity guaranteed via Outbox and Pessimistic Locking.

## Timeline

- **Phase 1 (Completed)**: Core platform with basic checkout and payment.
- **Phase 2 (Completed)**: Multi-vendor marketplace support and Notification Service.
- **Phase 3 (Current)**: Performance optimization, caching, and infrastructure automation.
- **Phase 4 (Next)**: Advanced analytics and mobile expansion.

## Learning Environment Assumptions

1. **Infrastructure**: Free-tier cloud services (Vercel, Render, NeonDB)
2. **Scale**: Learning-focused, not production-scale traffic
3. **Budget**: Minimal to no cost for learning purposes
4. **Time Commitment**: Part-time learning project
5. **Complexity**: Focus on learning concepts rather than enterprise features

## Technology Stack & Learning Tools

### Core Technologies (Learning Focus)

- **Backend**: NestJS (microservices framework), TypeORM (ORM patterns)
- **Frontend**: Next.js 14 (App Router, Server Components), Tailwind CSS
- **Database**: PostgreSQL with NeonDB (serverless Postgres)
- **Authentication**: Clerk (learn external auth integration)
- **Payments**: Stripe (learn payment processing flows)
- **Messaging**: RabbitMQ (learn event-driven architecture)

### Deployment & DevOps (Learning)

- **Containerization**: Docker (learn container basics)
- **Frontend Hosting**: Vercel (learn serverless deployment)
- **Backend Hosting**: Render (learn service deployment)
- **CI/CD**: GitHub Actions (learn automation)
- **Monitoring**: Full LGTM stack (Loki, Grafana, Prometheus, Jaeger)

---

_Last Updated: 2026-05-09_  
_Document Version: 1.0_
