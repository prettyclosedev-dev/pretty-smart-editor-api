# ------------------------------
# 1. Base builder image
# ------------------------------
FROM node:20-bullseye AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps --verbose

# Copy the entire project
COPY . .

# Generate Prisma client and Nexus schema, then build
RUN npx prisma generate
RUN npm run build --verbose

# ------------------------------
# 2. Production image
# ------------------------------
FROM node:20-bullseye AS runner

WORKDIR /usr/src/app

# ------------------------------
# Install Puppeteer / Chromium dependencies
# ------------------------------
RUN apt-get update && apt-get install -y \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libxshmfence1 \
  fonts-liberation \
  wget \
  unzip \
  ca-certificates \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Download Google Fonts and install locally
RUN apt-get update && apt-get install -y curl unzip ca-certificates && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/share/fonts/truetype/polotno && \
    curl -sL https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat-Regular.ttf -o /usr/share/fonts/truetype/polotno/Montserrat-Regular.ttf && \
    curl -sL https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf -o /usr/share/fonts/truetype/polotno/Poppins-Regular.ttf && \
    curl -sL https://github.com/google/fonts/raw/main/apache/opensans/OpenSans-Regular.ttf -o /usr/share/fonts/truetype/polotno/OpenSans-Regular.ttf && \
    fc-cache -f -v

# Copy only necessary files from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/schema.graphql ./schema.graphql

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose port (change if needed)
EXPOSE 4000

# Run migrations before start (optional)
# CMD npx prisma migrate deploy && node dist/server.js

# Start the app
CMD ["node", "dist/server.js"]
