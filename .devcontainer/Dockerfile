FROM oven/bun:1.3.4

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    openssh-client \
    postgresql-client \
    zip \
    jq \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
