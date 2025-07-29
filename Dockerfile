# Set base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy only package manager files first (for better caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy rest of your app
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Default command (for dev or prod)
CMD ["pnpm", "dev"]