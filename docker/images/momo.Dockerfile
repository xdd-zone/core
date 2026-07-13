FROM node:24-alpine AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /workspace

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build:momo
RUN pnpm --filter @xdd-zone/momo --prod deploy --legacy /app

FROM node:24-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build --chown=node:node /app ./

USER node

EXPOSE 7788

CMD ["node", "dist/index.js"]
