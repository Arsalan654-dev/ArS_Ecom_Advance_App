# Dockerfile for Node.js Backend

FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including netcat for healthcheck
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./
RUN npm ci --only=production

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1 

# Start the app
CMD ["node", "index.js"]
