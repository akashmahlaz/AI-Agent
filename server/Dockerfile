# ── Stage 1: Build Rust binary ────────────────────────────────────────────────
FROM rust:latest AS builder
WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Cache dependencies first
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release || true
RUN rm -rf src

# Build actual source (remove Windows-specific toolchain file)
COPY . .
RUN rm -f rust-toolchain.toml
RUN cargo build --release

# ── Stage 2: Minimal runtime ──────────────────────────────────────────────────
FROM debian:bookworm-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libssl3 libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/server /app/server
COPY --from=builder /app/migrations /app/migrations

RUN mkdir -p /app/workspaces

EXPOSE 8080

CMD ["/app/server"]
