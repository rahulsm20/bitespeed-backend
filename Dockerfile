FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# ---------- install dependencies ----------
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile
RUN apt-get update -y && apt-get install -y openssl

# production deps
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# ---------- build ----------
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production

RUN bunx prisma generate --schema=./src/prisma/schema.prisma

RUN bun build src/server.ts --outdir ./dist --target node --external:@prisma/client

# ---------- release image ----------
FROM base AS release
WORKDIR /usr/src/app

RUN apt-get update -y && apt-get install -y openssl

# copy production deps (with prisma client)
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/node_modules/@prisma ./node_modules/@prisma
COPY --from=prerelease /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# copy built server
COPY --from=prerelease /usr/src/app/dist ./dist
COPY --from=prerelease /usr/src/app/package.json ./
COPY --from=prerelease /usr/src/app/bun.toml ./bun.toml

USER bun
EXPOSE 3000
ENTRYPOINT ["bun", "dist/server.js"]
