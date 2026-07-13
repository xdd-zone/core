FROM node:22-alpine AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /workspace

COPY . .

RUN pnpm install --frozen-lockfile

ARG VITE_APP_ENV=production
ARG VITE_BOBO_BASE_URL
ARG VITE_MOMO_BASE_URL

ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_BOBO_BASE_URL=$VITE_BOBO_BASE_URL
ENV VITE_MOMO_BASE_URL=$VITE_MOMO_BASE_URL

RUN pnpm --filter @xdd-zone/fifa build

FROM nginxinc/nginx-unprivileged:1.29-alpine

COPY docker/nginx/fifa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/fifa/dist /usr/share/nginx/html

EXPOSE 8080
