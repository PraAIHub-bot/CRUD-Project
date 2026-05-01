# syntax=docker/dockerfile:1.6

# Stage 1 — install production dependencies with reproducible npm ci
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2 — production runtime image
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY app.js ./
COPY db ./db
COPY routes ./routes
COPY controllers ./controllers
COPY models ./models
COPY views ./views
COPY public ./public
EXPOSE 3000
CMD ["node", "app.js"]
