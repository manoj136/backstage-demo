# -------- Stage 1: Builder --------
FROM node:20.11.1-bullseye AS builder

WORKDIR /app

# Enable Yarn 4 (Corepack)
RUN corepack enable && corepack prepare yarn@4.4.1 --activate

# Copy only required files first (better caching)
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

# Install dependencies
RUN yarn install --no-immutable

# Copy full repo
COPY . .

# Copy production config into backend
RUN cp app-config.production.yaml packages/backend/

# Build backend bundle (THIS is the key step)
RUN yarn build:backend --config app-config.production.yaml

# Debug (can remove later)
RUN ls -R packages/backend/dist


# -------- Stage 2: Runtime --------
FROM node:20.11.1-bullseye-slim

WORKDIR /app

# Install only required OS deps
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create runtime dir
RUN mkdir -p /app

# Copy backend build artifacts ONLY
COPY --from=builder /app/packages/backend/dist /app/dist

# Extract skeleton (dependency structure)
RUN mkdir -p /app/runtime \
    && tar -xzf /app/dist/skeleton.tar.gz -C /app/runtime

# Install production dependencies
WORKDIR /app/runtime
RUN corepack enable && corepack prepare yarn@4.4.1 --activate \
    && yarn install --production

# Extract backend bundle
RUN tar -xzf /app/dist/bundle.tar.gz -C /app/runtime

# Copy config
COPY --from=builder /app/packages/backend/app-config.production.yaml /app/runtime/app-config.yaml

# Expose backend port
EXPOSE 7007

# Run backend
CMD ["node", "packages/backend", "--config", "app-config.yaml"]