#!/bin/sh

# ─────────────────────────────────────────────────────────────────────────────
# Kong Entrypoint: Environment Variable Substitution
#
# This script prepares the kong.yml declarative config by substituting
# environment variables into the template before Kong starts.
#
# On Render free-tier, all *_SERVICE_HOST vars must be the full public
# *.onrender.com hostname (without https:// or trailing slash).
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "[entrypoint] Starting Kong configuration..."

# ── Validate required variables ───────────────────────────────────────────────
MISSING_VARS=""
for var in USER_SERVICE_HOST CATALOG_SERVICE_HOST ORDER_SERVICE_HOST \
           PAYMENT_SERVICE_HOST NOTIFICATION_SERVICE_HOST \
           USER_SERVICE_PORT CATALOG_SERVICE_PORT ORDER_SERVICE_PORT \
           PAYMENT_SERVICE_PORT NOTIFICATION_SERVICE_PORT \
           UPSTREAM_PROTOCOL GATEWAY_INTERNAL_SECRET; do
  eval val=\$$var
  if [ -z "$val" ]; then
    MISSING_VARS="$MISSING_VARS $var"
  fi
done

if [ -n "$MISSING_VARS" ]; then
  echo "[entrypoint] ERROR: The following required environment variables are not set:$MISSING_VARS"
  echo "[entrypoint] Kong cannot start without these. Check your Render dashboard environment configuration."
  exit 1
fi

# ── Strip protocol and trailing slashes from hostnames ────────────────────────
# Guards against accidentally passing 'https://hostname/' instead of 'hostname'
USER_SERVICE_HOST=$(echo "$USER_SERVICE_HOST" | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')
CATALOG_SERVICE_HOST=$(echo "$CATALOG_SERVICE_HOST" | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')
ORDER_SERVICE_HOST=$(echo "$ORDER_SERVICE_HOST" | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')
PAYMENT_SERVICE_HOST=$(echo "$PAYMENT_SERVICE_HOST" | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')
NOTIFICATION_SERVICE_HOST=$(echo "$NOTIFICATION_SERVICE_HOST" | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')

# ── FRONTEND_URL fallback ─────────────────────────────────────────────────────
if [ -z "$FRONTEND_URL" ]; then
  FRONTEND_URL="http://localhost:3000"
  echo "[entrypoint] FRONTEND_URL not set — defaulting to http://localhost:3000"
fi


# ── Export cleaned values so envsubst can see them ────────────────────────────
export USER_SERVICE_HOST CATALOG_SERVICE_HOST ORDER_SERVICE_HOST \
       PAYMENT_SERVICE_HOST NOTIFICATION_SERVICE_HOST FRONTEND_URL

# ── Debug: print resolved targets (mask secret) ───────────────────────────────
echo "[entrypoint] Resolved service targets:"
echo "  user-service     → ${UPSTREAM_PROTOCOL}://${USER_SERVICE_HOST}:${USER_SERVICE_PORT}"
echo "  catalog-service  → ${UPSTREAM_PROTOCOL}://${CATALOG_SERVICE_HOST}:${CATALOG_SERVICE_PORT}"
echo "  order-service    → ${UPSTREAM_PROTOCOL}://${ORDER_SERVICE_HOST}:${ORDER_SERVICE_PORT}"
echo "  payment-service  → ${UPSTREAM_PROTOCOL}://${PAYMENT_SERVICE_HOST}:${PAYMENT_SERVICE_PORT}"
echo "  notification     → ${UPSTREAM_PROTOCOL}://${NOTIFICATION_SERVICE_HOST}:${NOTIFICATION_SERVICE_PORT}"
echo "  frontend-url     → ${FRONTEND_URL}"
MASKED_SECRET=$(printf "%s" "$GATEWAY_INTERNAL_SECRET" | cut -c 1-4)
MASKED_SECRET="${MASKED_SECRET}****"
echo "  gateway-secret   → ${MASKED_SECRET} (first 4 chars shown)"

# ── Render kong.yml from template ─────────────────────────────────────────────
envsubst \
  '${USER_SERVICE_HOST} ${USER_SERVICE_PORT}
   ${CATALOG_SERVICE_HOST} ${CATALOG_SERVICE_PORT}
   ${ORDER_SERVICE_HOST} ${ORDER_SERVICE_PORT}
   ${PAYMENT_SERVICE_HOST} ${PAYMENT_SERVICE_PORT}
   ${NOTIFICATION_SERVICE_HOST} ${NOTIFICATION_SERVICE_PORT}
   ${UPSTREAM_PROTOCOL}
   ${GATEWAY_INTERNAL_SECRET}
   ${FRONTEND_URL}' \
  < /etc/kong/kong.yml.template \
  > /etc/kong/kong.yml

echo "[entrypoint] kong.yml rendered successfully."

# ── Verify critical vars were actually substituted ──────────────────────────
# Note: REDIS_PASSWORD is intentionally excluded — it may be empty on Redis
# instances without auth, which is valid (substitution still occurs, to empty string).
for check_var in GATEWAY_INTERNAL_SECRET; do
  if grep -q "\${${check_var}}" /etc/kong/kong.yml; then
    echo "[entrypoint] ERROR: ${check_var} was not substituted in kong.yml!"
    echo "[entrypoint] Check that the variable is exported and visible to envsubst."
    exit 1
  fi
done

echo "[entrypoint] Configuration verified. Handing off to Kong..."

# ── Hand off to the official Kong entrypoint ──────────────────────────────────
exec /docker-entrypoint.sh "$@"
