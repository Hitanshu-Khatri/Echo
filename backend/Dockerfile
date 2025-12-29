# 1. Base image
FROM node:18-alpine

# 2. Set working directory inside container
WORKDIR /app

# 3. Copy dependency files first (for caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy rest of backend code
COPY . .

# 6. Expose backend port
EXPOSE 8000

# 7. Start backend
CMD ["node", "app.js"]
