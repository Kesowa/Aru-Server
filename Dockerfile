FROM node:19
RUN ls
RUN pwd
WORKDIR /home
RUN ls
WORKDIR /app
RUN apt-get update && apt-get -y install libtbb2
ADD ffmpeg.tar.gz /bin
ADD potree.tar.gz /bin
RUN cp /bin/liblaszip.so /usr/lib/liblaszip.so
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tsconfig.json ./
RUN cat .env
RUN npm run build
COPY .env /app/dist
WORKDIR /app/dist
# USER node
ENV MODE=production
CMD ["node", "server.js"]
