FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/server/package.json apps/server/
COPY apps/client/package.json apps/client/
COPY packages/expense-service/package.json packages/expense-service/
RUN bun install

COPY apps/server apps/server
COPY packages packages

EXPOSE 3001
ENV PORT=3001 NODE_ENV=production
CMD ["bun", "run", "apps/server/src/index.ts"]
