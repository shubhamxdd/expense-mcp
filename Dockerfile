FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/server/package.json apps/server/
COPY apps/client/package.json apps/client/
COPY packages/expense-service/package.json packages/expense-service/
RUN bun install --frozen-lockfile

COPY apps/server apps/server
COPY apps/client apps/client
COPY packages packages

RUN bun run --cwd apps/client build

RUN mkdir -p apps/server/data

EXPOSE 8080
ENV PORT=8080
VOLUME ["/app/apps/server/data"]
CMD ["bun", "run", "apps/server/src/index.ts"]
