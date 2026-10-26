# syntax=docker/dockerfile:1
FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS build
WORKDIR /app
COPY package.json package-lock.json ./
# The lockfile is produced with npm 11 (the base image ships npm 10).
RUN npm install -g npm@11.14.0 && npm ci
COPY . .
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_SOURCE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_SOURCE_URL=$VITE_SOURCE_URL
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31-alpine@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e
# The base image lags behind Alpine security fixes (brotli-libs, curl): upgrade OS packages, then drop root again.
# Remove this once a newer base image already ships the fixed packages.
USER root
RUN apk upgrade --no-cache
USER 101
# API_UPSTREAM: where /api/ is proxied (same-origin keeps the refresh cookie simple). Example: https://api.example.org
ENV API_UPSTREAM=http://localhost:3000
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
