# Stage 1: Build the frontend application
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:alpine
# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Nginx default configuration for SPA routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]