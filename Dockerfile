FROM node:24-alpine

WORKDIR /app

# Copy root and package files
COPY package.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY prisma ./prisma/

# Install dependencies
RUN npm install && npm --prefix client install && npm --prefix server install

# Copy source files
COPY client ./client
COPY server ./server

# Generate Prisma client & build
RUN cd server && npx prisma generate --schema=../prisma/schema.prisma
RUN cd client && npm run build
RUN cd server && npm run build

# No demo data is created in the image: the seed script wipes data and creates accounts
# with public default passwords, so it is never run during the build or at startup.
# The database lives on a volume and is created empty at container start.
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL="file:/data/ecolocate.db"
# JWT_SECRET is required and must be supplied at run time (docker run -e JWT_SECRET=...).

WORKDIR /app/server
CMD ["sh", "-c", "npx prisma db push --schema=../prisma/schema.prisma --skip-generate && node dist/index.js"]
