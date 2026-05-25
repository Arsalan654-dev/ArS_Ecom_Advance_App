# Dockerfile for Node.js Backend

FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Start the app
CMD ["node", "index.js"]
