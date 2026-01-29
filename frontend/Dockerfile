# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files
COPY package.json package-lock.json ./

# Copy all source files
COPY . .

# Set build-time environment variables (if needed)
# NEXT_PUBLIC_* variables must be available at build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}


# Debug info (temporary)
RUN node -v && npm -v
RUN echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
RUN echo "NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL"

RUN echo "==== FILE STRUCTURE ====" && ls -R app
RUN echo "==== FILE STRUCTURE ====" && ls -R components


# Build the Next.js application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Railway will inject PORT at runtime
# Next.js will automatically use process.env.PORT if available

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from standalone output
# Next.js standalone mode creates a minimal production bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public directory (Next.js standalone doesn't include it automatically)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy lib directory (needed for @/lib/api imports)
# Standalone mode may not include all source directories
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

USER nextjs

# Expose the port (Railway will inject $PORT at runtime)
# EXPOSE requires a number, but Railway will override with its own PORT
EXPOSE 3000

# Start the Next.js server
# In standalone mode, server.js is in the root of the standalone output
# Railway will inject PORT environment variable at runtime
CMD ["node", "server.js"]
