FROM node:20-slim

# Install build deps for better-sqlite3
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --production --no-audit --no-fund

COPY schema.sql server.mjs ./

CMD ["node", "server.mjs"]
