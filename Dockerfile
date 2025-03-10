FROM node:22.14.0-bookworm-slim@sha256:6bba748696297138f802735367bc78fea5cfe3b85019c74d2a930bc6c6b2fac4
WORKDIR /app

RUN apt-get update && apt-get install -y libgomp1

ADD ./dji_bin.tar.gz /bin
ADD ./dji_lib.tar.gz /lib
COPY package*.json ./
RUN npm ci
COPY . /app/
RUN npm run build
WORKDIR /app/src
CMD ["node", "server.js"]

