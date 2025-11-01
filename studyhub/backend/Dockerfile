# Stage 1: Dependencies (Builder)
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

# Stage 2: Production Runtime
FROM node:18-alpine

ENV NODE_ENV=production

RUN apk add --no-cache wget

RUN addgroup -g 1001 -S nodejs && \
    adduser -S node -u 1001

WORKDIR /app

RUN chown -R node:node /app

COPY --from=builder /app/package.json /app/package-lock.json /app/node_modules ./

COPY server.js ./
COPY models/ ./models/
COPY routes/ ./routes/
COPY middleware/ ./middleware/
COPY utils/ ./utils/

RUN chown -R node:node /app

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]