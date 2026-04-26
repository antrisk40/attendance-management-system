# Production: Vite preview serves the built app and proxies /api (no nginx)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
# Override in compose: http://backend:5000
ENV API_PROXY_TARGET=http://localhost:5000

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:80/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "80"]
