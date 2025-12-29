# Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build backend
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Production stage
FROM node:18-alpine
RUN apk add --no-cache nginx supervisor

# Copy built frontend to nginx
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copy backend
COPY --from=backend-build /app/backend /app/backend
WORKDIR /app/backend

# Copy nginx config
COPY nginx/default.conf /etc/nginx/http.d/default.conf

# Copy supervisor config
RUN mkdir -p /etc/supervisor.d
COPY <<EOF /etc/supervisor.d/supervisord.ini
[supervisord]
nodaemon=true

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true

[program:backend]
command=node app.js
directory=/app/backend
autostart=true
autorestart=true
EOF

