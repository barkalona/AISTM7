# Stage 1: Build Python dependencies
FROM python:3.9-slim as python-builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Stage 2: Build Node.js application
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Install Python
RUN apk add --no-cache python3 py3-pip

# Copy Python dependencies
COPY --from=python-builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy Node.js build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy Python source files
COPY services/*.py ./services/
COPY api/*.py ./api/
COPY utils/*.py ./utils/
COPY config/*.py ./config/

# Install production dependencies
RUN npm ci --only=production

# Copy configuration files
COPY .env.example .env
COPY jest.config.js .
COPY .eslintrc.js .
COPY .prettierrc.js .

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Expose ports
EXPOSE 3000
EXPOSE 3001

# Start the application
CMD ["npm", "start"]