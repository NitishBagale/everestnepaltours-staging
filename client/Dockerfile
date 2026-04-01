FROM node:20-alpine

WORKDIR /app

# Install PM2
RUN npm install -g pm2

# Copy package files FROM client folder
COPY client/package*.json ./

# Install deps
RUN npm ci

# Copy source
COPY client/ .

# Build
RUN npm run build

EXPOSE 3000

CMD ["pm2-runtime", "npm", "--", "start", "--", "-H", "0.0.0.0", "-p", "3000"]