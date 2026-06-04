# Fix Notification Service Import Errors Plan

The `notification-service` fails to build because it cannot find the `@repo/common` package during compilation. This happens because `@repo/common` is not listed under `dependencies` in `apps/notification-service/package.json`, unlike other services (e.g. `payment-service`, `user-service`).

## Task Checklist

- [x] Add `@repo/common` dependency to `apps/notification-service/package.json`
- [x] Run `pnpm install` at the workspace root to regenerate the lockfile and link `@repo/common`
- [x] Build the notification service using `pnpm build --filter notification-service --no-cache` to verify it compiles successfully
