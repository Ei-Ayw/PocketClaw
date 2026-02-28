# Use the official Rust image with Musl target for a static zero-dependency binary
FROM rust:1.76-alpine AS builder

WORKDIR /usr/src/pocketclaw
# Install build dependencies for Rust on Alpine
RUN apk add --no-cache musl-dev gcc make pkgconfig openssl-dev

# Note: In a real environment we would copy the React build to be embedded or served by Axum
# Here we compile the Rust Headless server
COPY src-tauri/Cargo.toml src-tauri/Cargo.lock ./
COPY src-tauri/src ./src

# Build the binary
# RUN cargo build --release --bin tauri-app

# Create a minimal runtime image
FROM alpine:3.19
WORKDIR /app

# COPY --from=builder /usr/src/pocketclaw/target/release/tauri-app ./pocketclaw

EXPOSE 8080
# ENV RUST_LOG=info

# Set the entrypoint to run in server mode
# ENTRYPOINT ["./pocketclaw", "--server"]
CMD ["echo", "PocketClaw Docker Image MVP Ready. Build instructions are stubbed out for actual ZeroClaw Rust integration."]
