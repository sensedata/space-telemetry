FROM node:26.10.0-slim AS pnpm
COPY --from=ghcr.io/pnpm/pnpm:12.6.0 /opt/pnpm/ /opt/pnpm/
ENV PATH=/opt/pnpm:$PATH
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

FROM pnpm AS build
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY vite.config.ts ./
COPY src/contract/ src/contract/
COPY src/client/ src/client/
RUN pnpm build

FROM pnpm AS deps
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

FROM node:26.10.0-slim
WORKDIR /app
COPY package.json ./
COPY --from=deps /app/node_modules/ node_modules/
COPY src/contract/ src/contract/
COPY src/server/ src/server/
COPY --from=build /app/dist/ dist/
ENV NODE_ENV=production

CMD ["node", "src/server/server.ts"]
