FROM node@sha256:27fab5920246070cf13449cf44c25bc4f5adef18ca7482b2bda90b7cf9e64481
WORKDIR /app
ADD ffmpeg.tar.gz /bin
ADD potree.tar.gz /bin
RUN cp /bin/liblaszip.so /usr/lib/liblaszip.so
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tsconfig.json ./
RUN npm run build
WORKDIR /app/dist
# USER node
# ENV NODE_ENV=production
CMD ["node", "server.js"]