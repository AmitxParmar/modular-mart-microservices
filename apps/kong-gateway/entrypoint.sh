#!/bin/sh

# Strip protocol and trailing slashes if they were accidentally included in the environment variables
USER_SERVICE_HOST=$(echo "$USER_SERVICE_HOST" | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')
CATALOG_SERVICE_HOST=$(echo "$CATALOG_SERVICE_HOST" | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')
ORDER_SERVICE_HOST=$(echo "$ORDER_SERVICE_HOST" | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')
PAYMENT_SERVICE_HOST=$(echo "$PAYMENT_SERVICE_HOST" | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')
NOTIFICATION_SERVICE_HOST=$(echo "$NOTIFICATION_SERVICE_HOST" | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')

# Export them so envsubst can see the updated values
export USER_SERVICE_HOST CATALOG_SERVICE_HOST ORDER_SERVICE_HOST PAYMENT_SERVICE_HOST NOTIFICATION_SERVICE_HOST

# Render the Kong declarative config by substituting environment variables.
# All vars listed here must be set in docker-compose.yml / render.yaml.
envsubst \
  '${USER_SERVICE_HOST} ${USER_SERVICE_PORT}
   ${CATALOG_SERVICE_HOST} ${CATALOG_SERVICE_PORT}
   ${ORDER_SERVICE_HOST} ${ORDER_SERVICE_PORT}
   ${PAYMENT_SERVICE_HOST} ${PAYMENT_SERVICE_PORT}
   ${NOTIFICATION_SERVICE_HOST} ${NOTIFICATION_SERVICE_PORT}
   ${UPSTREAM_PROTOCOL}
   ${GATEWAY_INTERNAL_SECRET}' \
  < /etc/kong/kong.yml.template \
  > /etc/kong/kong.yml

# Hand off to the official Kong entrypoint
exec /docker-entrypoint.sh "$@"
