# Use the official Node.js image as the base
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./

# Install dependencies
RUN pnpm install

# Copy application code
COPY . .

# Build the project (if using TypeScript)
RUN pnpm build

# Expose port
EXPOSE 3000

# Environment variable for Hono to listen on all interfaces
ENV HOST 0.0.0.0

# Run production server
CMD ["pnpm", "start"]
