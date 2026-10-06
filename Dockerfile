FROM node:26-slim AS build

WORKDIR /app

RUN npm install -g pnpm@12.6.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Two-stage build with Vite for build alone; second stage omits dev deps.
COPY vite.config.ts ./
COPY src/contract/ src/contract/
COPY src/client/ src/client/
RUN pnpm build

FROM node:26-slim

WORKDIR /app

RUN npm install -g pnpm@12.6.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

COPY src/contract/ src/contract/
COPY src/server/ src/server/
COPY --from=build /app/dist/ dist/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server/server.ts"]
