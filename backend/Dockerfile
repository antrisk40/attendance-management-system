# Attendance API — Node.js + Prisma (PostgreSQL)
FROM node:20-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl curl \
  && rm -rf /var/lib/apt/lists/*

# Native deps (bcrypt, etc.) may need a compiler on some platforms
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

# Drop devDependencies, then keep prisma CLI for `migrate deploy` in the entrypoint
RUN npm prune --omit=dev
RUN npm install prisma@5.7.0 --no-save

ENV NODE_ENV=production
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:5000/health > /dev/null || exit 1

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "src/index.js"]
