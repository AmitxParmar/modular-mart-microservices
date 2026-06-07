# Kong API Gateway

This service serves as the new API gateway for the e-commerce microservices platform, replacing the old NestJS-based gateway.
It uses Kong OSS 3.9.2 in DB-less mode.

## Features
- Local rate limiting for development.
- Memory proxy caching.
- Correlation IDs and OpenTelemetry observability.
- Health-based load balancing.
- Shared-secret injection for the service trust boundary.

## Getting Started
The main Compose stack starts Kong by default and keeps the legacy NestJS
gateway behind the `legacy-gateway` profile:

```bash
docker compose up -d
```

To run only the standalone gateway Compose file, start the microservices first,
then run:

```bash
docker compose -f apps/kong-gateway/docker-compose.yml up -d
```

`GATEWAY_INTERNAL_SECRET=ecommerce-internal-trust-2026-xyz` is the local
development default. It must match the value used by every microservice.
Generate and inject a random secret for staging and production.
