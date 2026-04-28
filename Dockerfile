# ---- Stage 1: Build ----
FROM node:20.11.1-bullseye AS builder

WORKDIR /app

# Fix Yarn version (IMPORTANT)
RUN corepack enable && corepack prepare yarn@4.4.1 --activate

# Copy everything
COPY . .

# Install dependencies
RUN yarn install --no-immutable

# Build full monorepo (correct way)
RUN yarn build

# ---- Stage 2: Runtime ----
FROM node:20.11.1-bullseye-slim

WORKDIR /app

# Copy only built output (NOT whole repo)
COPY --from=builder /app/dist /app/dist

# Install only production dependencies
RUN yarn workspaces focus --all --production && yarn cache clean

# Expose backend port
EXPOSE 7007

# Start backend
CMD ["node", "backend/index.cjs.js", "--config", "app-config.yaml", "--config", "app-config.production.yaml"]