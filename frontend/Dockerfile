FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --no-audit --no-fund

COPY . .

# Set env for build time (using local api default)
ENV NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Build production nextjs app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
