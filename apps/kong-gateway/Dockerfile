FROM kong:3.9.2

COPY kong.yml /etc/kong/kong.yml

ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/etc/kong/kong.yml

USER kong
EXPOSE 8000 8001

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["kong", "docker-start"]
