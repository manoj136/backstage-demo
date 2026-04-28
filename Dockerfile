# ---- Stage 1: Build ----
FROM node:20.11.1-bullseye AS builder

WORKDIR /app

# Fix Yarn version (IMPORTANT)
RUN corepack enable && corepack prepare yarn@4.4.1 --activate

# Copy everything
COPY . .

# Install dependencies
RUN yarn install --no-immutable

# Force correct build
RUN yarn build
RUN yarn build:backend

# Debug (optional)
RUN ls -R packages/backend/dist

# Verify artifacts exist
RUN test -f packages/backend/dist/skeleton.tar.gz
RUN test -f packages/backend/dist/bundle.tar.gz

# ---- Stage 2: Runtime ----
FROM node:20.11.1-bullseye-slim

WORKDIR /app

# Copy required files
COPY --from=builder /app /app

# Create runtime directory
RUN mkdir -p /app/runtime

# Extract skeleton (dependencies structure)
RUN tar -xzf packages/backend/dist/skeleton.tar.gz -C /app/runtime

# Extract backend bundle
RUN tar -xzf packages/backend/dist/bundle.tar.gz -C /app/runtime

# Move into runtime workspace
WORKDIR /app/runtime

# Install production dependencies
RUN yarn install --production --no-immutable

EXPOSE 7007

CMD ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.production.yaml"]