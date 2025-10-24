# Base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files AND lockfile
COPY package*.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy source code (assume TS is already compiled to dist/)
COPY dist ./dist

# Expose port
EXPOSE 3000

# Environment variable for Hono
ENV HOST=0.0.0.0

# Run the app
CMD ["pnpm", "start"]
