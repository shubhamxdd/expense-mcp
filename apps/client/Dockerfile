FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/client/package.json apps/client/
COPY packages/expense-service/package.json packages/expense-service/
RUN bun install --frozen-lockfile

COPY apps/client apps/client
COPY packages packages

RUN bun run --cwd apps/client build

FROM nginx:alpine
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80
