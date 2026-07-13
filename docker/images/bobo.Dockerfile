FROM node:24-alpine AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /workspace

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build:bobo

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=4399
ENV HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=build --chown=node:node /workspace/apps/bobo/.next/standalone ./
COPY --from=build --chown=node:node /workspace/apps/bobo/.next/static ./apps/bobo/.next/static
COPY --from=build --chown=node:node /workspace/apps/bobo/public ./apps/bobo/public

USER node

EXPOSE 4399

CMD ["node", "apps/bobo/server.js"]
