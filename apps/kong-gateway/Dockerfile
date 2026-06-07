FROM kong:3.9.2

USER root

# Install gettext for envsubst (needed to render kong.yml.template)
RUN apt-get update -qq && apt-get install -y --no-install-recommends gettext-base && rm -rf /var/lib/apt/lists/*

# Copy template and entrypoint script
COPY kong.yml.template /etc/kong/kong.yml.template
COPY entrypoint.sh /entrypoint.sh

# Strip Windows CRLF line endings (in case the file was edited on Windows)
# and make the entrypoint executable
RUN sed -i 's/\r//' /entrypoint.sh /etc/kong/kong.yml.template && \
    chmod +x /entrypoint.sh && \
    chown kong:kong /etc/kong/kong.yml.template /etc/kong

ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/etc/kong/kong.yml

USER kong
EXPOSE 8000 8001

ENTRYPOINT ["/entrypoint.sh"]
CMD ["kong", "docker-start"]
