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
RUN pwd
RUN ls
RUN cat .env
COPY .env /app/dist
WORKDIR /app/dist
# USER node
ENV MODE=production
CMD ["node", "server.js"]
