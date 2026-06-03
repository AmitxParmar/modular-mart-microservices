# Plan: Fix Notification Service Build Errors

This plan addresses the build errors found in the `notification-service`.

## Tasks

- [x] **Fix missing `helmet` dependency**
    - [x] Install `helmet` in `apps/notification-service`.
    - status: complete

- [x] **Fix TS1272 errors (Type referenced in decorated signature)**
    - [x] Update `src/notifications/consumers/order-events.consumer.ts`: Use `import type` for `OrderCreatedEvent` and `OrderCancelledEvent`.
    - [x] Update `src/notifications/consumers/user-events.consumer.ts`: Use `import type` for `UserCreatedEvent`.
    - [x] Update `src/notifications/notifications.controller.ts`: Use `import type` for `ClerkUser`.
    - status: complete

- [x] **Fix Supertest import in E2E tests**
    - [x] Update `test/app.e2e-spec.ts`: Change `import * as request` to `import request`.
    - status: complete

- [x] **Fix Runtime Errors (Docker/Render Compatibility)**
    - [x] Update `src/config/env.schema.ts`: Allow empty strings for optional URL fields (`SENTRY_DSN`, `JAEGER_ENDPOINT`).
    - [x] Update `src/app.module.ts`: Import `AuthClientModule` to resolve `AUTH_SERVICE` dependency for `RolesGuard`.
    - [x] Update Event Consumers: Change `@Injectable()` to `@Controller()` for all consumers in the `controllers` array.
    - [x] Update `src/main.ts`: Fix `health/(.*)` route path warning for NestJS 11.
    - status: complete

- [x] **Verification**
    - [x] Run `pnpm build` in `apps/notification-service`.
    - [x] Run `npx tsc --noEmit` to verify all TS errors are gone.
    - [x] Build and run Docker container to verify startup.
    - status: complete

## Technical Explanation

1. **Helmet Dependency:** The `main.ts` file imports `helmet`, but it was not listed in `package.json`.
2. **TS1272 Errors:** With `isolatedModules: true` and `emitDecoratorMetadata: true`, TypeScript requires types used in decorated parameters to be imported using `import type` if they are not classes.
3. **Supertest Import:** `esModuleInterop: true` is enabled, which prefers default imports for CommonJS modules like `supertest`.
4. **Environment Validation:** Zod's `.url()` fails on empty strings. Adding `.or(z.literal(''))` allows empty values often used in development or Render placeholders.
5. **Dependency Injection:** `RolesGuard` (from `@repo/auth`) requires `AUTH_SERVICE`. `AuthClientModule` provides this and must be imported in the app.
6. **Controller Decorators:** Classes listed in a module's `controllers` array MUST have the `@Controller()` decorator in NestJS.
