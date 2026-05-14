FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY src ./src
RUN mkdir -p src/uploads

EXPOSE 4000

CMD ["pnpm", "start"]
