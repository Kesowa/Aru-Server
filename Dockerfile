FROM node:18
WORKDIR /app
RUN apit-get update && apt-get -y install libtbb2
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