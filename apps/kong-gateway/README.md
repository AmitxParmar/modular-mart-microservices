# Kong API Gateway

This service serves as the new API gateway for the e-commerce microservices platform, replacing the old NestJS-based gateway.
It uses Kong OSS 3.4.

## Features
- Shared external Redis for distributed rate limiting.
- Memory proxy caching.
- Correlation IDs and OpenTelemetry observability.
- Health-based load balancing.

## Getting Started
To start the gateway locally, ensure you have set up your `.env` variables or substitute them, then run:

```bash
pnpm start
```
