# ---- Stage 1: Build ----
FROM node:20.11.1-bullseye AS builder

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN yarn install --no-immutable

RUN  yarn tsc

# Build app
RUN yarn backstage-cli repo build

# ---- Stage 2: Runtime ----
FROM node:20.11.1-bullseye-slim

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app /app

# Install only production dependencies
RUN yarn workspaces focus --all --production

# Expose backend port
EXPOSE 7007

# Start backend
CMD ["node", "packages/backend/dist/index.cjs.js", "--config", "app-config.yaml", "--config", "app-config.production.yaml"]