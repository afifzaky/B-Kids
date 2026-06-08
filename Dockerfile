# =============================================================
# Stage 1: builder — compile TypeScript → dist/
# =============================================================
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Install dependencies first (layer cache)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy only source files needed for the build — avoid COPY . .
# which may inadvertently include .env, secrets, or dev artefacts.
COPY src ./src
COPY tsconfig.json ./

RUN npx prisma generate
RUN npm run build


# =============================================================
# Stage 2: runner — production image
# =============================================================
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

# Create a dedicated non-root user so the process cannot perform
# administrative actions even if the container is compromised.
RUN addgroup -S appgroup \
    && adduser -S appuser -G appgroup

ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev \
    && npx prisma generate \
    && chown -R appuser:appgroup /app

# Copy compiled output from builder stage
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

# Drop to non-root before starting the process
USER appuser

EXPOSE 4000

CMD ["node", "dist/server.js"]
