FROM node:22-alpine AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /workspace

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @xdd-zone/momo build
RUN pnpm --filter @xdd-zone/momo --prod deploy /app

FROM node:22-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build --chown=node:node /app ./

USER node

EXPOSE 7788

CMD ["node", "dist/index.js"]
