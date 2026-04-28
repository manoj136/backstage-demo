# ---- Stage 1: Build ----
FROM node:20.11.1-bullseye AS builder

WORKDIR /app

# Fix Yarn version (IMPORTANT)
RUN corepack enable && corepack prepare yarn@4.4.1 --activate

# Copy everything
COPY . .

# Install dependencies
RUN yarn install --no-immutable

# Build Backstage (this handles tsc internally)
RUN yarn backstage-cli repo build

# ---- Stage 2: Runtime ----
FROM node:20.11.1-bullseye-slim

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app /app

# Install only production dependencies
RUN yarn workspaces focus --all --production && yarn cache clean

# Expose backend port
EXPOSE 7007

# Start backend
CMD ["node", "packages/backend/dist/index.cjs.js", "--config", "app-config.yaml", "--config", "app-config.production.yaml"]