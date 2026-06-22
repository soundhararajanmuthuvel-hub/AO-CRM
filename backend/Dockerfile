FROM node:20-slim

# Install system dependencies required for Puppeteer / Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium instead of downloading
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./

RUN npm install --no-audit --no-fund

COPY . .

# Generate Prisma Client during build
RUN npx prisma generate

# Ensure session folders have read/write access
RUN mkdir -p sessions uploads && chmod -R 777 sessions uploads

EXPOSE 5000

CMD ["npm", "start"]
