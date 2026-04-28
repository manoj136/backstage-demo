# ---------- Build ----------
FROM node:20-bullseye AS builder

WORKDIR /app

# Enable Yarn properly
RUN corepack enable

COPY . .

RUN yarn install --immutable

# Build EVERYTHING (app + backend)
RUN yarn tsc
RUN yarn build:backend

# Verify backend output
RUN ls -R packages/backend/dist


# ---------- Runtime ----------
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app /app

RUN yarn workspaces focus --all --production

EXPOSE 7007

CMD ["node", "packages/backend/dist/index.cjs.js"]