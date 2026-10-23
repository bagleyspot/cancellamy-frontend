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

FROM nginxinc/nginx-unprivileged:1.30-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
# API_UPSTREAM: where /api/ is proxied (same-origin keeps the refresh cookie simple). Example: https://api.example.org
ENV API_UPSTREAM=http://localhost:3000
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
