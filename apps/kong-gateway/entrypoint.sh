#!/bin/sh

# Render the Kong declarative config by substituting environment variables.
# All vars listed here must be set in docker-compose.yml / render.yaml.
envsubst '${USER_SERVICE_HOST} ${CATALOG_SERVICE_HOST} ${ORDER_SERVICE_HOST} ${PAYMENT_SERVICE_HOST} ${NOTIFICATION_SERVICE_HOST} ${GATEWAY_INTERNAL_SECRET}' \
  < /etc/kong/kong.yml.template \
  > /etc/kong/kong.yml

# Hand off to the official Kong entrypoint
exec /docker-entrypoint.sh "$@"
