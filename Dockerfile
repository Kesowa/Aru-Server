FROM node@sha256:92f06fc13bcc09f1ddc51f6ebf1aa3d21a6532b74f076f224f188bc6b9317570
WORKDIR /app
RUN apt-get update && apt-get -y install libtbb2
ADD ./ffmpeg.tar.gz /bin
ADD  ./potree.tar.gz /bin
ADD ./dji_bin.tar.gz /bin
ADD ./dji_lib.tar.gz /lib
RUN cp /bin/liblaszip.so /usr/lib/liblaszip.so
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tsconfig.json ./
RUN npm run build
WORKDIR /app/dist
ENV NODE_ENV=production
CMD ["node", "server.js"]
