# Set base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Add the native build tools needed for better-sqlite3 (remove mvs3)
RUN apk add --no-cache python3 make g++

# Install pnpm globally
RUN npm install -g pnpm

# Copy only package manager files first (for better caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Rebuild native modules inside this environment (remove mvs3)
RUN pnpm rebuild better-sqlite3

# Copy rest of your app
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Default command (for dev or prod)
CMD ["pnpm", "dev"]