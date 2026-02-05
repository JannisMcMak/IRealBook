# -------- Base deps --------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY packages/app/package*.json packages/app/
COPY packages/server/package*.json packages/server/
COPY packages/shared packages/shared/
COPY packages/irealpro packages/irealpro/
RUN npm ci
RUN npm run build:deps

# -------- Build app --------
FROM deps AS app-builder
WORKDIR /app/packages/app
COPY packages/app .
RUN npm run build

# -------- Build server --------
FROM deps AS server-builder
WORKDIR /app/packages/server
COPY packages/server .
RUN npm run build

# -------- Runtime image --------
FROM node:24-alpine AS runtime
WORKDIR /app

# Server runtime files
COPY --from=server-builder /app/packages/server/dist ./dist
COPY --from=server-builder /app/packages/server/package*.json ./
COPY --from=deps /app/packages/irealpro /app/packages/irealpro
COPY --from=deps /app/node_modules ./node_modules

# App build → server public folder
COPY --from=app-builder /app/packages/app/dist ./public
COPY packages/app/public ./public

# Copy Views & Library
COPY packages/server/seed ./seed
COPY packages/server/views ./views

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]