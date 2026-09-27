FROM node:24-slim

WORKDIR /app

# npm replaces .npmrc's omit list with the command line's, so optional is named again here
# to keep ws's native modules out.
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --omit=optional

COPY server/ server/
COPY public/ public/

ENV NODE_ENV=production
EXPOSE 5000
USER node

# Exec form: no shell stands between SIGTERM and node, whose handler saves the buffer.
CMD ["node", "server/server.js"]
