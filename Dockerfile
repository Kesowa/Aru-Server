FROM node:19
ARG FILE_PATH
COPY $FILE_PATH /app/.env
WORKDIR /app
RUN ls -a
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
RUN cat .env
# USER node
ENV MODE=production
CMD ["node", "server.js"]
