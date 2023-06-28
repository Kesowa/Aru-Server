FROM node:19
WORKDIR /app
RUN apt-get update && apt-get -y install libtbb2
ADD ffmpeg.tar.gz /bin
ADD potree.tar.gz /bin
RUN cp /bin/liblaszip.so /usr/lib/liblaszip.so
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tsconfig.json ./
RUN npm run build
COPY .env /app/dist
WORKDIR /app/dist
# USER node
# ENV NODE_ENV=production
CMD ["node", "server.js"]
