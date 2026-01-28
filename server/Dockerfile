FROM node:20-alpine

WORKDIR /app

# Copy dependency files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the full source
COPY . .

# Expose backend port
EXPOSE 8008

# Run as non-root for security
USER node

CMD ["npm", "start"]
